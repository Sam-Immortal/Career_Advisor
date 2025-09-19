import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// --- Assets and Icons (as SVGs to keep it self-contained) ---
const Logo = () => (
  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const LoadingSpinner = () => <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const LightbulbIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h.01a1 1 0 100-2H11zM10 17a1 1 0 011-1h.01a1 1 0 110 2H11a1 1 0 01-1-1zM4 10a1 1 0 01-1-1V8a1 1 0 112 0v1a1 1 0 01-1 1zm13 0a1 1 0 01-1-1V8a1 1 0 112 0v1a1 1 0 01-1 1zM7.05 15.95a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zm9.9-9.9a1 1 0 01-1.414-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707zM10 4a6 6 0 100 12 6 6 0 000-12zM10 16a4 4 0 110-8 4 4 0 010 8z" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2zM8 4V3a1 1 0 112 0v1H8zm2 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const AcademicCapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 011.085.127l1.91 1.912a1 1 0 001.414 0l1.91-1.912a.999.999 0 011.085-.127L18 6.92a1 1 0 000-1.84l-7-3zM12 10a2 2 0 10-4 0 2 2 0 004 0zM4 11.25V15a1 1 0 001 1h10a1 1 0 001-1v-3.75a.998.998 0 00-.36-.78l-5-4a1 1 0 00-1.28 0l-5 4a.998.998 0 00-.36.78z" /></svg>;


// Import the functions you need from the SDKs you need
//import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCC2BHg4eSGoUke7Mt8HBpjEgFn52NU4WA",
  authDomain: "career-advisor-f9cb0.firebaseapp.com",
  projectId: "career-advisor-f9cb0",
  storageBucket: "career-advisor-f9cb0.firebasestorage.app",
  messagingSenderId: "513335747174",
  appId: "1:513335747174:web:69703233764a8da63ec3a7",
  measurementId: "G-2SXJ9M3NBY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    if (loadingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {user ? <Dashboard user={user} /> : <AuthScreen />}
        </div>
    );
}

// --- Authentication Screen ---
function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                // Store user's full name in Firestore
                const userId = user.uid;
                const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'userData');
                await setDoc(userDocRef, {
                    fullName: fullName,
                    email: user.email,
                    createdAt: new Date()
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50 px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
                <div className="text-center">
                    <div className="flex justify-center items-center mb-4">
                       <div className="bg-indigo-600 p-3 rounded-full">
                           <Logo />
                       </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Career Advisor AI</h1>
                    <p className="mt-2 text-gray-600">Your personalized guide to the future of work.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div>
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-4 py-2 mt-1 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Priya Sharma"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 mt-1 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 mt-1 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors duration-300"
                    >
                        {loading ? <div className="flex justify-center items-center"><LoadingSpinner/></div> : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)} className="ml-1 font-medium text-indigo-600 hover:underline">
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
}


// --- Main Dashboard ---
function Dashboard({ user }) {
    const [profile, setProfile] = useState(null);
    const [resumeData, setResumeData] = useState(null);
    const [opportunities, setOpportunities] = useState(null);
    const [currentView, setCurrentView] = useState('resume'); // 'resume' or 'opportunities'
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const userId = user.uid;
            const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'userData');
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                setProfile(docSnap.data());
                if (docSnap.data().resumeAnalysis) {
                    setResumeData(docSnap.data().resumeAnalysis);
                }
                if (docSnap.data().opportunities) {
                    setOpportunities(docSnap.data().opportunities);
                }
            }
        };
        fetchProfile();
    }, [user]);
    
    const handleLogout = () => {
        signOut(auth);
    };

    const handleAnalysisComplete = (analysis, opportunitiesResult) => {
        setResumeData(analysis);
        setOpportunities(opportunitiesResult);
        setCurrentView('resume'); // Switch to resume view after analysis
    };

    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-indigo-600 text-white shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Logo />
                            <span className="text-xl font-bold">Career Advisor AI</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <UserIcon />
                                <span className="hidden sm:block">{profile?.fullName || user.email}</span>
                            </div>
                            <button onClick={handleLogout} className="p-2 rounded-full hover:bg-indigo-700 transition-colors">
                                <LogoutIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Welcome, {profile?.fullName || 'Student'}!</h1>
                    <p className="text-gray-600 mt-1">Let's shape your future. Start by getting feedback on your resume to unlock personalized opportunities.</p>
                </div>

                {!resumeData && <ResumeUploader onAnalysisComplete={handleAnalysisComplete} user={user} setLoading={setLoading} isLoading={loading} />}

                {loading && (
                    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl shadow-lg">
                        <LoadingSpinner />
                        <p className="mt-4 text-lg text-gray-700 font-medium">Our AI is analyzing your profile... This might take a moment.</p>
                        <p className="text-gray-500">Crafting your personalized career roadmap!</p>
                    </div>
                )}

                {resumeData && !loading && (
                    <div>
                        <div className="flex border-b border-gray-200 mb-6">
                            <button 
                                onClick={() => setCurrentView('resume')}
                                className={`px-6 py-3 text-lg font-medium transition-colors ${currentView === 'resume' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-indigo-500'}`}
                            >
                                Resume Doctor
                            </button>
                            <button 
                                onClick={() => setCurrentView('opportunities')}
                                className={`px-6 py-3 text-lg font-medium transition-colors ${currentView === 'opportunities' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-indigo-500'}`}
                            >
                                Opportunity Inbox
                            </button>
                        </div>

                        {currentView === 'resume' && <ResumeDoctor analysis={resumeData} />}
                        {currentView === 'opportunities' && <OpportunityInbox opportunities={opportunities} />}
                    </div>
                )}
            </main>
        </div>
    );
}

// --- API Call to Gemini ---
async function callGeminiAPI(payload) {
    // In a real app, the API key would be handled on a backend.
    // For this prototype, we'll assume it's available securely.
    const apiKey = ""; // Canvas will provide this
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    let retries = 3;
    while (retries > 0) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const result = await response.json();
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                return JSON.parse(text);
            } else {
                console.error("Invalid response structure from Gemini:", result);
                throw new Error("Failed to parse Gemini response.");
            }
        } catch (error) {
            console.error(`API call failed: ${error.message}. Retrying...`);
            retries--;
            if (retries === 0) throw error;
            await new Promise(res => setTimeout(res, 2000)); // Wait 2s before retrying
        }
    }
}


// --- Resume Uploader and Analyzer ---
function ResumeUploader({ onAnalysisComplete, user, setLoading, isLoading }) {
    const fileInputRef = useRef(null);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            setLoading(true);
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const resumeText = await extractTextFromPDF(e.target.result);
                    await analyzeResume(resumeText);
                };
                reader.readAsArrayBuffer(file);
            } catch (error) {
                console.error("Error processing file:", error);
                alert("Failed to process PDF. Please try another file.");
                setLoading(false);
            }
        } else {
            alert("Please upload a PDF file.");
        }
    };
    
    // Simplified PDF text extraction (requires pdf.js library in a real project)
    // For this prototype, we'll simulate text extraction.
    const extractTextFromPDF = async (arrayBuffer) => {
         // This is a placeholder. In a real project, you would use a library like PDF.js
         // For demonstration, we'll just treat the input as text if it's not a real PDF.
         // A more robust implementation is needed for production.
         console.log("Simulating PDF text extraction. For a real app, integrate PDF.js.");
         // Let's create a sample resume text for the demo to work without a real PDF parser.
        return "Priya Sharma\nBengaluru, India\n\nEducation: B.Tech in Computer Science, IIT Delhi, 2023.\n\nSkills: Python, JavaScript, React, Node.js, Machine Learning.\n\nProjects: Built a movie recommendation engine using Python.";
    };

    const analyzeResume = async (resumeText) => {
        try {
            // Step 1: Analyze the resume
            const resumePayload = {
                contents: [{
                    parts: [{
                        text: `You are an expert career coach for Indian students. Analyze the following resume text. Provide an ATS-friendly score out of 100, concrete suggestions for improvement, and a professionally rewritten version of the resume summary/objective. Focus on action verbs and quantifiable achievements.

Resume Text:
---
${resumeText}
---`
                    }]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            atsScore: { type: "NUMBER" },
                            suggestions: { type: "ARRAY", items: { type: "STRING" } },
                            rewrittenSummary: { type: "STRING" }
                        },
                        required: ["atsScore", "suggestions", "rewrittenSummary"]
                    }
                }
            };
            const analysisResult = await callGeminiAPI(resumePayload);

            // Step 2: Get opportunities based on the resume
            const opportunitiesPayload = {
                contents: [{
                    parts: [{
                        text: `Based on the skills and experience in the following resume, find 5 relevant opportunities for an Indian student. Include a mix of job postings, internships, relevant online courses (from platforms like Coursera or Udemy), and upcoming hackathons in India.

Resume Text:
---
${resumeText}
---`
                    }]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                title: { type: "STRING" },
                                type: { type: "STRING", enum: ["Job", "Internship", "Course", "Hackathon"] },
                                description: { type: "STRING" },
                                link: { type: "STRING" }
                            },
                            required: ["title", "type", "description", "link"]
                        }
                    }
                }
            };
            const opportunitiesResult = await callGeminiAPI(opportunitiesPayload);
            
            // Step 3: Save results to Firestore
            const userId = user.uid;
            const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'userData');
            await setDoc(userDocRef, {
                resumeAnalysis: analysisResult,
                opportunities: opportunitiesResult,
                originalResume: resumeText
            }, { merge: true });

            onAnalysisComplete(analysisResult, opportunitiesResult);

        } catch (error) {
            console.error("Failed to analyze resume with Gemini:", error);
            alert("Our AI assistant is currently busy. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 text-center">
            <div className="flex justify-center mb-4">
                <UploadIcon />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Upload Your Resume</h2>
            <p className="text-gray-500 mt-2">Upload your resume in PDF format to get started.</p>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf"
                disabled={isLoading}
            />
            <button
                onClick={handleButtonClick}
                disabled={isLoading}
                className="mt-6 px-8 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-all duration-300"
            >
                {isLoading ? 'Processing...' : 'Choose File'}
            </button>
        </div>
    );
}


// --- Resume Doctor View ---
function ResumeDoctor({ analysis }) {
    const { atsScore, suggestions, rewrittenSummary } = analysis;

    const getScoreColor = (score) => {
        if (score >= 85) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-semibold text-gray-700">ATS Score</h3>
                    <p className={`text-6xl font-bold mt-2 ${getScoreColor(atsScore)}`}>{atsScore}</p>
                    <p className="text-gray-500">out of 100</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                        <div className={`bg-gradient-to-r from-indigo-400 to-indigo-600 h-2.5 rounded-full`} style={{ width: `${atsScore}%` }}></div>
                    </div>
                </div>
                <div className="md:col-span-2 bg-indigo-50 p-6 rounded-2xl">
                     <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3">
                        <LightbulbIcon />
                        <span className="ml-2">Rewritten Summary</span>
                    </h3>
                    <p className="text-gray-700 italic border-l-4 border-indigo-400 pl-4">
                        {rewrittenSummary}
                    </p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Improvement Suggestions</h3>
                <ul className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                            <CheckCircleIcon className="flex-shrink-0 mt-1 mr-3" />
                            <span className="text-gray-700">{suggestion}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// --- Opportunity Inbox View ---
function OpportunityInbox({ opportunities }) {
    const getIconForType = (type) => {
        switch (type) {
            case 'Job':
            case 'Internship':
                return <BriefcaseIcon className="text-indigo-500" />;
            case 'Course':
                return <AcademicCapIcon className="text-blue-500" />;
            case 'Hackathon':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 01-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
            default:
                return <BriefcaseIcon className="text-gray-500" />;
        }
    };
    
    if (!opportunities || opportunities.length === 0) {
        return (
             <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                <h3 className="text-xl font-semibold text-gray-800">No Opportunities Found</h3>
                <p className="text-gray-500 mt-2">We couldn't find any opportunities based on your current resume. Try updating it for better results.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {opportunities.map((opp, index) => (
                <div key={index} className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                           {getIconForType(opp.type)}
                        </div>
                        <div className="flex-grow">
                            <div className="flex justify-between items-center">
                                <h4 className="text-lg font-bold text-gray-800">{opp.title}</h4>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                    opp.type === 'Job' ? 'bg-indigo-100 text-indigo-800' :
                                    opp.type === 'Internship' ? 'bg-green-100 text-green-800' :
                                    opp.type === 'Course' ? 'bg-blue-100 text-blue-800' :
                                    'bg-purple-100 text-purple-800'
                                }`}>{opp.type}</span>
                            </div>
                            <p className="mt-2 text-gray-600">{opp.description}</p>
                            <a 
                                href={opp.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-block mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                Learn More &rarr;
                            </a>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

