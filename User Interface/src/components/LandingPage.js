import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './LandingPage.css';
import logo from '../assets/logo.png';
import robot from '../assets/robot.png';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleGetStartedClick = () => {
        navigate('/chat'); // Redirect to chat page
    };

    const handleFreeTrialClick = () => {
        navigate('/chat'); // Redirect to chat page
    };

    return (
        <div className="landing-page">
            <header className="header">
                <img src={logo} alt="شعار ArabMedicalGPT" className="logo" />
                <nav className="navigation">
                    <a href="#home">الرئيسية</a>
                    <a href="#about">من نحن</a>
                    <a href="#contact">اتصل بنا</a>
                    <button className="cta-button" onClick={handleFreeTrialClick}>ابدأ تجربتك المجانية</button>
                </nav>
            </header>
            <main className="main-content">
                <div className="text-content">
                    <h1>ArabMedicalGPT</h1>
                    <p> ArabMedicalGPT و نموذج لغوي متقدم باللغة العربية مخصص للتطبيقات الطبية، يعتمد على القدرات قوة النماذج اللغوية الكبيرة . </p>
                    <div className="cta-form">
                        <input type="email" placeholder="أدخل بريدك الإلكتروني" />
                        <button onClick={handleGetStartedClick}>ابدأ الآن</button>
                    </div>
                </div>
                <div className="image-content">
                    <img src={robot} alt="صورة روبوت" className="robot-image" />
                </div>
            </main>
        </div>
    );
};

export default LandingPage;

