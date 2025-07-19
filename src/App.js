import React, { useState, useEffect, useMemo } from 'react';
import { Search, Clapperboard, Tv, Star, Film, Tv2, LoaderCircle } from 'lucide-react';

// --- Configuration ---
// WARNING: It is not recommended to store API keys directly in the frontend code in a production environment.
// This is done here for demonstration purposes.
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
const ITEMS_PER_PAGE = 12; // We will fetch and show 12 items at a time
const REQUEST_TIMEOUT = 60000; // 60 seconds timeout

// --- Helper Components ---

const Spinner = () => (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
        <LoaderCircle className="animate-spin text-blue-500 h-16 w-16" />
        <p className="text-slate-600">Finding recommendations for you...</p>
    </div>
);

const ErrorDisplay = ({ message }) => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg my-4" role="alert">
        <p className="font-bold">An error occurred</p>
        <p>{message}</p>
    </div>
);

const WelcomeScreen = () => (
    <div className="text-center p-8 md:p-16 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
                <Clapperboard size={48} className="text-blue-500" />
            </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">CineBot</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
            Discover your next favorite movie or TV show. Just type a genre, a title, or anything you're in the mood for, and let our AI find the best recommendations for you.
        </p>
    </div>
);

// --- Core Components ---

const SearchBar = ({ onSearch, isLoading }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() && !isLoading) {
            onSearch(query.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-8">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by genre, movie, or TV show..."
                    className="w-full px-5 py-3 sm:py-4 pr-12 text-base sm:text-lg bg-white border-2 border-slate-200 rounded-full focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition-shadow duration-300"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-14 h-full text-slate-500 hover:text-blue-600 disabled:opacity-50"
                    disabled={isLoading}
                >
                    <Search size={24} />
                </button>
            </div>
        </form>
    );
};

const MediaCard = ({ item }) => {
    const platformLogos = {
        'Netflix': 'https://img.icons8.com/color/48/netflix.png',
        'Amazon Prime Video': 'https://img.icons8.com/color/48/amazon-prime-video.png',
        'Disney+': 'https://img.icons8.com/color/48/disney-plus.png',
        'Hulu': 'https://img.icons8.com/color/48/hulu.png',
        'HBO Max': 'https://img.icons8.com/color/48/hbo-max.png',
        'Max': 'https://img.icons8.com/color/48/hbo-max.png', // Using HBO Max icon for Max
        'Apple TV+': 'https://img.icons8.com/color/48/apple-tv.png',
        'Peacock': 'https://img.icons8.com/color/48/peacock-tv.png',
        'Paramount+': 'https://img.icons8.com/fluency/48/paramount-plus.png',
        'Crunchyroll': 'https://img.icons8.com/color/48/crunchyroll.png',
        'Showtime': 'https://img.icons8.com/color/48/showtime.png',
        'Starz': 'https://img.icons8.com/color/48/starz.png',
        'Default': 'https://placehold.co/32x32/e2e8f0/64748b?text=?'
    };

    // Generate a consistent, colorful gradient based on the title
    const stringToHslColor = (str, s, l, offset = 0) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = (hash + offset) % 360;
        return `hsl(${h}, ${s}%, ${l}%)`;
    };
    
    // New "Aurora" gradient style
    const cardStyle = {
        background: `${stringToHslColor(item.title, 50, 20, 0)}`,
        backgroundImage: `
            radial-gradient(at 80% 20%, ${stringToHslColor(item.title, 70, 40, 0)} 0px, transparent 50%),
            radial-gradient(at 20% 80%, ${stringToHslColor(item.title, 70, 40, 60)} 0px, transparent 50%)
        `,
    };

    return (
        <div className="group relative rounded-xl shadow-md overflow-hidden transform transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-2xl hover:z-10 aspect-[2/3]">
            <div style={cardStyle} className="absolute inset-0 transition-all duration-300"></div>
            
            {/* Default visible content (pre-hover) */}
            <div className="relative p-4 h-full flex flex-col justify-center items-center text-center bg-black/20 group-hover:opacity-0 transition-opacity duration-300">
                <h3 className="text-white text-2xl sm:text-3xl font-bold drop-shadow-lg leading-tight">{item.title}</h3>
                <p className="text-white/70 text-base sm:text-lg font-medium drop-shadow-lg">{item.year}</p>
            </div>

            {/* Expanded details view (on hover) - NOW FULLY SCROLLABLE */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="h-full w-full overflow-y-auto p-4">
                    <h3 className="text-white text-xl sm:text-2xl font-bold">{item.title} ({item.year})</h3>
                    <div className="flex items-center text-yellow-300 my-2">
                        <Star size={20} className="mr-1.5 fill-current" />
                        <span className="text-white font-semibold text-lg">{item.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <p className="text-slate-200 text-sm my-4">{item.summary}</p>
                    <div className="border-t border-slate-500 pt-3 mt-4">
                        <h4 className="text-white font-semibold mb-2">Available on:</h4>
                        <div className="flex flex-wrap gap-2">
                            {(item.streamingPlatforms || []).map(platform => (
                                 <span key={platform} className="flex items-center bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    <img
                                        src={platformLogos[platform] || platformLogos['Default']}
                                        alt={platform}
                                        className="w-4 h-4 mr-1.5"
                                    />
                                    {platform}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResultsGrid = ({ items }) => {
    if (!items || items.length === 0) {
        return <p className="text-center text-slate-500 py-8">No results found for this category.</p>;
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {items.map((item, index) => (
                <MediaCard key={`${item.title}-${index}`} item={item} />
            ))}
        </div>
    );
};

const Tabs = ({ activeTab, setActiveTab }) => {
    const tabsData = [
        { id: 'movies', label: 'Movies', icon: Film },
        { id: 'tvShows', label: 'TV Shows', icon: Tv2 },
    ];

    return (
        <div className="mb-6 border-b border-slate-200">
            <nav className="-mb-px flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2" aria-label="Tabs">
                {tabsData.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${
                            activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm sm:text-md flex items-center gap-2 transition-colors`}
                    >
                        <tab.icon size={20} />
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};


// --- Main App Component ---

export default function App() {
    const [searchQuery, setSearchQuery] = useState('');
    const [movies, setMovies] = useState([]);
    const [tvShows, setTvShows] = useState([]);
    
    const [activeTab, setActiveTab] = useState('movies');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [canFetchMore, setCanFetchMore] = useState(true);


    // --- API Call Logic ---
    const fetchFromGemini = async (prompt) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                }
            };
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.error?.message || `API request failed with status ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content) {
                const rawText = result.candidates[0].content.parts[0].text;
                
                const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                
                if (jsonMatch && jsonMatch[0]) {
                    const jsonString = jsonMatch[0];
                    try {
                        const parsedJson = JSON.parse(jsonString);
                        return parsedJson.recommendations || [];
                    } catch (parseError) {
                        console.error("Final JSON parsing attempt failed. Raw JSON string that was extracted:", jsonString);
                        throw new Error("AI response was malformed and could not be repaired.");
                    }
                } else {
                    console.error("No valid JSON object could be extracted from the raw text:", rawText);
                    throw new Error("AI did not return a recognizable JSON object.");
                }

            } else {
                 if (result.candidates && result.candidates[0].finishReason === 'SAFETY') {
                     throw new Error("The query was blocked for safety reasons. Please try a different query.");
                 }
                throw new Error("The AI returned an empty or invalid response.");
            }
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                throw new Error("The request took too long and was timed out. Please try again.");
            }
            throw err;
        }
    };

    const createPrompt = (query, itemType, existingTitles = []) => {
        let exclusionText = '';
        if (existingTitles.length > 0) {
            exclusionText = `Do NOT include any of the following titles: ${existingTitles.join(', ')}.`;
        }
        
        return `
            Find ${ITEMS_PER_PAGE} relevant ${itemType} for the query: "${query}".
            ${exclusionText}
            For each item, provide title, year, summary, rating, and streamingPlatforms. Use common platform names like Netflix, Hulu, Max, Disney+, Amazon Prime Video, Apple TV+, Peacock, Paramount+, Crunchyroll, Showtime, Starz.
            IMPORTANT: Your response MUST be a single JSON object with one key: "recommendations", which is an array of the found items.
            DO NOT include any other text, notes, or markdown formatting like \`\`\`json.
            
            Example response format:
            {
              "recommendations": [
                {
                  "title": "Example Movie",
                  "year": 2023,
                  "summary": "An example summary.",
                  "rating": 8.5,
                  "streamingPlatforms": ["Netflix", "Hulu"]
                }
              ]
            }
        `;
    };

    // --- Search and Fetch More Logic ---
    const handleInitialSearch = async (query) => {
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        setSearchQuery(query);
        setCanFetchMore(true);

        const moviePrompt = createPrompt(query, 'movies');
        const tvShowPrompt = createPrompt(query, 'TV shows');

        try {
            const [movieResults, tvShowResults] = await Promise.all([
                fetchFromGemini(moviePrompt),
                fetchFromGemini(tvShowPrompt)
            ]);

            setMovies(movieResults);
            setTvShows(tvShowResults);

            if (movieResults.length === 0 && tvShowResults.length > 0) {
                setActiveTab('tvShows');
            } else {
                setActiveTab('movies');
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
            setMovies([]);
            setTvShows([]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleShowMore = async () => {
        if (isFetchingMore || !canFetchMore) return;

        setIsFetchingMore(true);
        setError(null);

        const isMovieTab = activeTab === 'movies';
        const existingItems = isMovieTab ? movies : tvShows;
        const existingTitles = existingItems.map(item => item.title);
        const itemType = isMovieTab ? 'movies' : 'TV shows';

        const prompt = createPrompt(searchQuery, itemType, existingTitles);

        try {
            const newResults = await fetchFromGemini(prompt);
            if (newResults.length > 0) {
                if (isMovieTab) {
                    setMovies(prev => [...prev, ...newResults]);
                } else {
                    setTvShows(prev => [...prev, ...newResults]);
                }
            }
            if (newResults.length < ITEMS_PER_PAGE) {
                setCanFetchMore(false);
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsFetchingMore(false);
        }
    };

    const currentList = useMemo(() => {
        return activeTab === 'movies' ? movies : tvShows;
    }, [activeTab, movies, tvShows]);

    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <div className="container mx-auto px-4 py-8">
                <header className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Tv size={32} className="text-blue-500" />
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">CineBot</h1>
                    </div>
                </header>

                <main>
                    <SearchBar onSearch={handleInitialSearch} isLoading={isLoading} />
                    
                    {isLoading && <Spinner />}
                    {error && <ErrorDisplay message={error} />}

                    {!isLoading && !error && !hasSearched && <WelcomeScreen />}

                    {!isLoading && hasSearched && (
                        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
                            <ResultsGrid items={currentList} />
                            
                            {currentList.length > 0 && canFetchMore && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={handleShowMore}
                                        disabled={isFetchingMore}
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                    >
                                        {isFetchingMore ? (
                                            <span className="flex items-center gap-2">
                                                <LoaderCircle className="animate-spin h-5 w-5" />
                                                Loading...
                                            </span>
                                        ) : 'Show More'}
                                    </button>
                                </div>
                            )}
                             {!canFetchMore && currentList.length > 0 && (
                                <p className="text-center text-slate-500 mt-8">No more results found.</p>
                            )}
                        </div>
                    )}
                </main>
                
                <footer className="text-center mt-12 text-slate-500 text-sm">
                    <p className="mb-2">
                        Made by Mrigank Rai
                    </p>
                    <div className="flex justify-center items-center gap-4">
                        <a href="https://github.com/mrigankrai05" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors" aria-label="GitHub Profile">
                            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        </a>
                        <a href="https://www.linkedin.com/in/mrigank-rai-8b39a130a/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors" aria-label="LinkedIn Profile">
                            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current"><title>LinkedIn</title><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
}
