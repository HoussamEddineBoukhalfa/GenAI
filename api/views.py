from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate
import pinecone
from pinecone import Pinecone, ServerlessSpec
import pickle
import google.generativeai as genai
from os import path
import mtranslate as mt
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from django.http import JsonResponse


def download_hugging_face_embeddings():
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return embeddings
# Load pre-trained models and embeddings
if path.exists("embeddings_model.pkl"):
    with open("embeddings_model.pkl", "rb") as f:
        embeddings = pickle.load(f)
else:
    embeddings = download_hugging_face_embeddings()
    with open("embeddings_model.pkl", "wb") as f:
        pickle.dump(embeddings, f)

def load_pdf(data):
    loader = DirectoryLoader(data, glob="*.pdf", loader_cls=PyPDFLoader)
    documents = loader.load()
    return documents

extracted_data = None
if path.exists("extracted_data.pkl"):
    with open("extracted_data.pkl", "rb") as f:
        extracted_data = pickle.load(f)
else:
    extracted_data = load_pdf("MedicalGPT/data/")
    with open("extracted_data.pkl", "wb") as f:
        pickle.dump(extracted_data, f)


def text_split(extracted_data):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size = 500, chunk_overlap = 20)
    text_chunks = text_splitter.split_documents(extracted_data)
    return text_chunks

text_chunks = text_split(extracted_data)




index_name = "rag-index1"
api_key = ""
genai_key = ""

# Initialize Pinecone and AI Model
pc = Pinecone(api_key=api_key, embeddings=embeddings)
genai.configure(api_key=genai_key)
index = pc.Index(index_name)
model = genai.GenerativeModel('gemini-1.5-pro')


template = "You are ArabMedicalGPT an arabic medical assistant your job is like a doctor you will" + \
" be given symptoms and try to identify" + \
" the disease as accurately as possible," + \
" given these details {0}." +\
" \nUser prompt: {1}."+\
" \nand here are the previous questions from the same User, consider them in answering this question if necessary: {2}."+\
"If the curent user prompt is not related to medical diagnosis, ignore it. "


class ConversationalAI:
    def __init__(self, api_key, embeddings, index_name):
        self.pc = Pinecone(api_key=api_key, embeddings=embeddings)
        if index_name not in self.pc.list_indexes().names():
            self.index = self.pc.create_index(
                name=index_name,
                dimension=384,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                ) 
            )
        else:
            self.index = self.pc.Index(index_name)
        
        self.context = {}  # Dictionary to store conversation context for each user

    def get_relevant(self, query, top_k=5):
        res = self.index.query(vector=embeddings.embed_query(query), top_k=top_k)
        indices = [int(match["id"]) - 1 for match in res.to_dict()["matches"]]
        chunks = [text_chunks[index].page_content for index in indices]
        return chunks

    def get_answer(self, user_id, query, model=None, top_k=5, template=""):
        context = self.context.get(user_id, [])
        print("context: ", context)
        query_translated = mt.translate(query, "en")
        relevant_content = self.get_relevant(query_translated, top_k)
        input_text = template.format("\n".join(relevant_content), query_translated, "\n".join(context))
        ans = model.generate_content(input_text)
        self.context[user_id] = [query_translated] + context
        return mt.translate(ans.text, "ar")

conversational_ai = ConversationalAI(api_key=api_key, embeddings=embeddings, index_name=index_name)

@api_view(['POST'])
#def get_response(request):
#    user_id = request.data.get('user_id')
#    query = request.data.get('query')
#    response = conversational_ai.get_answer(user_id, query, model=model, top_k=10, template=template)
#    return Response({"response": response})
def get_response(request):
    try:
        user_id = request.data.get('user_id')
        query = request.data.get('query')

        # Assuming this is where your AI processing happens
        response = conversational_ai.get_answer(user_id, query, model=model, top_k=5, template=template)
        return JsonResponse({"response": response})
    
    except Exception as e:
        print(f"Error in get_response: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)
