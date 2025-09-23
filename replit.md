# Career Advisor App

## Overview

A career advisor application built with React and Vite that provides resume analysis and career guidance. The frontend is a modern React application using Tailwind CSS for styling, while the backend features a Python FastAPI service that analyzes resumes using Google's Gemini AI and provides job matching based on a dataset of job descriptions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19.1.1 with Vite as the build tool
- **Styling**: Tailwind CSS for utility-first styling with PostCSS processing
- **Development Server**: Configured to run on port 5000 with host binding for Replit compatibility
- **Code Quality**: ESLint configuration with React-specific rules and hooks validation

### Backend Architecture
- **Framework**: FastAPI for high-performance API development
- **AI Integration**: Google Generative AI (Gemini) for resume analysis and career suggestions
- **Document Processing**: Support for PDF (PyMuPDF) and DOCX (python-docx) resume formats
- **Text Analysis**: scikit-learn for TF-IDF vectorization and cosine similarity matching
- **CORS**: Configured for cross-origin requests from multiple development environments

### Data Processing
- **Resume Analysis**: Text extraction and cleaning from uploaded documents
- **Job Matching**: Cosine similarity matching against job description dataset
- **Skills Extraction**: Pattern matching and keyword extraction from resume content

### Authentication & Data Storage
- **Firebase**: Integrated for potential authentication and data persistence
- **Job Data**: CSV-based job description dataset for matching algorithms

## External Dependencies

### Frontend Dependencies
- **React**: Core framework with React DOM
- **Firebase**: Authentication and backend services
- **Tailwind CSS**: Utility-first CSS framework with autoprefixer
- **Vite**: Fast build tool and development server

### Backend Dependencies
- **FastAPI**: Modern Python web framework
- **Google Generative AI**: Gemini AI model for intelligent resume analysis
- **Document Processing**: PyMuPDF for PDF parsing, python-docx for Word documents
- **Machine Learning**: scikit-learn for text vectorization and similarity analysis
- **Data Handling**: pandas for CSV data manipulation

### Development Tools
- **ESLint**: Code quality and consistency enforcement
- **PostCSS**: CSS processing and optimization
- **python-multipart**: File upload handling in FastAPI