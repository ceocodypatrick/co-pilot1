

import React, { useState, useCallback, useEffect, useRef, FC, PropsWithChildren, Component, ErrorInfo, ReactNode, useMemo, ChangeEvent, KeyboardEvent } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { marked } from 'https://esm.sh/marked@13.0.0';


// Note: In a real environment, you would install these dependencies.
// For this preview, we assume they are available.
// import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { useDropzone } from 'react-dropzone';
// import html2canvas from 'html2canvas';
// import { jsPDF } from 'jspdf';

declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
    Recharts: any;
    // Add useDropzone to window for the preview environment
    useDropzone: (options: any) => {
      getRootProps: (props?: any) => any;
      getInputProps: (props?: any) => any;
      isDragActive: boolean;
    };
  }
}

// Mock imports for preview environment. The real functionality is included below.
const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell: RechartsCell } = window.Recharts || {
    ResponsiveContainer: ({ children }: PropsWithChildren<{}>) => <div style={{ width: '100%', height: 300 }}>{children}</div>,
    BarChart: ({ children, data }: {children: ReactNode, data: any[]}) => <div className="p-4 bg-gray-800 rounded-lg text-white">BarChart Placeholder for {data?.length} items</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: ({ active, payload }: {active?: boolean, payload?: any[]}) => active && payload && payload.length ? <div className="bg-gray-700 p-2 rounded border border-gray-600">Tooltip</div> : null,
    Legend: () => <div className="text-sm">Legend</div>,
    PieChart: ({ children }: PropsWithChildren<{}>) => <div style={{width: '100%', height: '100%'}}>{children}</div>,
    Pie: ({data}: {data: any[]}) => <div className="p-4 bg-gray-800 rounded-lg text-white">PieChart Placeholder for {data?.length} items</div>,
    Cell: () => null,
};

const useDropzone = window.useDropzone || ((options: any) => {
    const onDrop = options.onDrop;
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && onDrop) {
            onDrop(Array.from(event.target.files));
        }
    };
    return { 
        getRootProps: (props = {}) => ({...props}), 
        getInputProps: (props = {}) => ({ ...props, type: 'file', onChange: handleFileChange, accept: options.accept, multiple: options.multiple }),
        isDragActive: false
    };
});
// html2canvas and jspdf will be accessed directly from the window object when needed.


//================================================================
// TYPE DEFINITIONS
//================================================================
interface Audience {
  artistName: string;
  artistInfo: string;
  demographics: {
    ageRange: string;
    gender: string;
    topCountries: string[];
    primaryLanguage: string;
  };
  psychographics: {
    interests: string[];
    values: string[];
    personalityTraits: string[];
  };
  onlineBehavior: {
    socialMediaUsage: string[];
    preferredContent: string[];
    onlineShopping: string;
  };
}

interface Insight {
  title: string;
  description: string;
  actionable_advice: string;
}

interface MarketAnalysis {
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  competitors: {
    name: string;
    strengths: string;
    weaknesses: string;
  }[];
  market_trends: string[];
  target_platforms: string[];
}

interface ContentIdea {
  platform: string;
  idea: string;
  format: string;
  potential_impact: string;
}

interface ContentPlan {
  content_pillars: string[];
  content_ideas: ContentIdea[];
  posting_schedule: {
    platform: string;
    frequency: string;
    best_time_to_post: string;
  };
}

interface PressRelease {
  headline: string;
  subheadline: string;
  body: string;
  boilerplate: string;
  contact_info: string;
}

interface FinancialPlan {
  revenue_streams: {
    stream: string;
    short_term_potential: string;
    long_term_potential: string;
  }[];
  budget_allocation: {
    category: string;
    percentage: number;
    notes: string;
  }[];
  financial_goals: string[];
}

interface SummitScoreData {
  score: number;
  explanation: string;
  areas_for_improvement: string[];
}

interface RoyaltySplit {
    id: number;
    songTitle: string;
    collaborators: {
        name: string;
        contribution: string;
        percentage: number;
    }[];
    isFinalized: boolean;
}

interface MasterProposal {
    title: string;
    executive_summary: string;
    sections: {
        title: string;
        content: string;
    }[];
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ReputationMention {
    uri: string;
    title: string;
}

interface ReputationData {
    summary: string;
    themes: string[];
    mentions: ReputationMention[];
}

interface ReleaseTask {
    text: string;
    completed: boolean;
}

interface ReleaseTaskGroup {
    category: string;
    items: ReleaseTask[];
}

interface ReleaseTimeframe {
    title: string;
    groups: ReleaseTaskGroup[];
}

interface ReleasePlan {
    artistName: string;
    releaseTitle: string;
    releaseDate: string; // ISO string
    timeframes: ReleaseTimeframe[];
}

interface SuggestedReply {
    category: string;
    text: string;
}

interface FanMailAnalysis {
    sentiment: { name: string, value: number }[];
    keyThemes: string[];
    suggestedReplies: SuggestedReply[];
    contentIdeas: string[];
}

interface VenueInfo {
    name: string;
    location: string;
    capacity?: string;
    contact?: string;
    reasoning: string;
}

interface Setlist {
    songs: string[];
    notes: string;
}

interface MerchIdea {
    item: string;
    description: string;
}

interface TourPlan {
    venues: VenueInfo[];
    setlist: Setlist;
    merchandise: MerchIdea[];
}

interface AIGeneratedImage {
    prompt: string;
    aspectRatio: string;
    url: string;
}

interface LyricIdeaSet {
    titles: string[];
    concepts: { title: string; description: string; }[];
    progression: string;
}

interface SocialPost {
    platform: 'Instagram' | 'Twitter' | 'TikTok';
    content: string;
    hashtags: string[];
}

interface MerchConcept {
    item: string;
    description: string;
    design_prompt: string;
}

interface AppNotification {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface DealMemoAnalysis {
    summary: string;
    key_terms: { term: string; explanation: string; }[];
    red_flags: string[];
}

interface BrandKit {
    brand_statement: string;
    color_palettes: { name: string; colors: string[]; }[];
    font_pairings: { headline: string; body: string; }[];
    logo_prompts: string[];
}

interface AudioTranscription {
    text: string;
    fileName: string;
}

interface ArtistBio {
    short: string;
    medium: string;
    long: string;
}

interface SyncPitch {
    music_supervisors: {
        name: string;
        company: string;
        reasoning: string;
    }[];
    pitch_email: {
        subject: string;
        body: string;
    };
}

interface Guide {
    id: string;
    title: string;
    description: string;
    unlocksWith: keyof DashboardData | 'initial';
    icon: ReactNode;
    content?: string; // Pre-loaded for static guides
    cta?: {
        text: string;
        buttonText: string;
        url: string;
    }
}

interface Contact {
    id: number;
    name: string;
    role: string;
    company: string;
    email?: string;
    notes?: string;
}

interface ArtworkAnalysis {
    analysisA: string;
    analysisB: string;
    recommendation: string;
    winner: 'A' | 'B' | 'None';
    imageA_url: string; // Store the URL of the analyzed image
    imageB_url: string;
}

interface DashboardData {
    audience?: Audience;
    insights?: Insight[];
    marketAnalysis?: MarketAnalysis;
    contentPlan?: ContentPlan;
    pressRelease?: PressRelease;
    financialPlan?: FinancialPlan;
    summitScore?: SummitScoreData;
    masterProposal?: MasterProposal;
    reputationData?: ReputationData;
    releasePlan?: ReleasePlan;
    fanMailAnalysis?: FanMailAnalysis;
    tourPlan?: TourPlan;
    aiGeneratedImage?: AIGeneratedImage;
    lyricIdeas?: LyricIdeaSet;
    socialPosts?: SocialPost[];
    merchConcepts?: MerchConcept[];
    dealMemoAnalysis?: DealMemoAnalysis;
    brandKit?: BrandKit;
    audioTranscription?: AudioTranscription;
    artistBio?: ArtistBio;
    royaltySplits?: RoyaltySplit[];
    syncPitch?: SyncPitch;
    contacts?: Contact[];
    artworkAnalysis?: ArtworkAnalysis;
}

type LoadingStates = { [K in keyof DashboardData | 'chat' | 'guide' | 'royaltySplitSuggestion']?: boolean };
type ErrorStates = { [K in keyof DashboardData | 'chat' | 'guide' | 'royaltySplitSuggestion']?: string | null };

//================================================================
// ICONS
//================================================================
const IconWrapper: FC<PropsWithChildren<{ className?: string }>> = ({ children, className = "h-6 w-6" }) => <div className={className}>{children}</div>;
const ArrowDownTrayIcon = () => <IconWrapper className="h-5 w-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg></IconWrapper>;
const BookOpenIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg></IconWrapper>;
const CalendarDaysIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" /></svg></IconWrapper>;
const ChartBarIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg></IconWrapper>;
const ChartTrendingUpIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-.625m3.75.625V3.375" /></svg></IconWrapper>;
const ChatBubbleOvalLeftEllipsisIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.372c-1.131.113-2.056.63-2.785 1.275a2.11 2.11 0 01-2.999 0l-2.785-1.275a2.11 2.11 0 00-2.999 0l-3.722-.372C3.847 17.097 3 16.136 3 15v-4.286c0-.97.616-1.813 1.5-2.097l5.51-1.653a2.25 2.25 0 012.002 0l5.51 1.653z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" /></svg></IconWrapper>;
const ClipboardDocumentCheckIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></IconWrapper>;
const ClipboardIcon = () => <IconWrapper className="h-4 w-4"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg></IconWrapper>;
const ClipboardListIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></IconWrapper>;
const CurrencyDollarIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.826-1.106-2.156 0-2.982.553-.413 1.282-.62 2.003-.62.72 0 1.43.207 2 .62.98.728 2.245.244 2.52-1.014a1.125 1.125 0 00-1.342-1.342c-1.352-.903-3.053-.903-4.404 0-1.352.903-1.352 2.374 0 3.277.553.413 1.282.62 2.003-.62.72 0 1.43-.207 2-.62.98.728 2.245.244 2.52-1.014a1.125 1.125 0 00-1.342-1.342c-1.352-.903-3.053-.903-4.404 0-1.352.903-1.352 2.374 0 3.277z" /></svg></IconWrapper>;
const DocumentDuplicateIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V9.375m0 9.375a3.375 3.375 0 01-3.375 3.375H9.375a3.375 3.375 0 01-3.375-3.375m7.5 10.375a3.375 3.375 0 003.375-3.375V9.375" /></svg></IconWrapper>;
const DocumentTextIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg></IconWrapper>;
const EnvelopeIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg></IconWrapper>;
const FilmIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v6m0 0l-2.25 1.313M3 7.5l2.25-1.313M3 7.5v6m0 0l2.25 1.313M12 4.5v15m0 0l-3.75-2.162M12 19.5l3.75-2.162M12 19.5l-7.5-4.33v-6.34L12 4.5l7.5 4.33v6.34L12 19.5z" /></svg></IconWrapper>;
const FireIcon = () => <IconWrapper className="text-green-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048l-1.04-1.04A8.25 8.25 0 0112 3c1.228 0 2.38.34 3.362.914l-2.02 2.02zM18 12a6 6 0 11-12 0 6 6 0 0112 0z" /></svg></IconWrapper>;
const GiftIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg></IconWrapper>;
const IdentificationIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></IconWrapper>;
const LightBulbIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-1.5c1.5-1.5 1.5-3.75 0-5.25S13.5 3.75 12 3.75s-3 1.5-3 3.75c0 .75.25 1.5.75 2.25 1.25 1.5 2.25 2.25 2.25 3.75zm-3 4.5h6" /></svg></IconWrapper>;
const LockClosedIcon = () => <IconWrapper className="h-5 w-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg></IconWrapper>;
const MapIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0v2.25m0-2.25h1.5m-1.5 0H5.25m11.25-8.25v2.25m0-2.25h-1.5m1.5 0h.008v.008h-.008v-.008zm-3.75 0h.008v.008h-.008v-.008zm-3.75 0h.008v.008h-.008v-.008zM12 21a8.25 8.25 0 008.25-8.25c0-4.995-4.57-9.568-8.25-9.568S3.75 7.755 3.75 12.75A8.25 8.25 0 0012 21z" /></svg></IconWrapper>;
const MicrophoneIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 013-3 3 3 0 013 3v8.25a3 3 0 01-3 3z" /></svg></IconWrapper>;
const MountainIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg></IconWrapper>;
const MusicalNoteIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V7.5A2.25 2.25 0 0019.5 5.25v-.003" /></svg></IconWrapper>;
const NewspaperIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-13.5c-.621 0-1.125-.504-1.125-1.125v-9.75c0 .621.504-1.125 1.125-1.125H6.75" /></svg></IconWrapper>;
const PaperAirplaneIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg></IconWrapper>;
const PencilSquareIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg></IconWrapper>;
const ScaleIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.036.243c-2.132 0-4.14-.71-5.685-1.942m-2.62-10.726C5.175 5.487 4.175 5.661 3.165 5.82c-.483.174-.711.703-.59 1.202L5.2 17.747c1.545 1.232 3.553 1.942 5.685 1.942.82 0 1.63-.12 2.4-.36l.004-.002z" /></svg></IconWrapper>;
const ShareIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.186 2.25 2.25 0 00-3.933 2.186z" /></svg></IconWrapper>;
const SparklesIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 7.5l.41-1.42a.5.5 0 01.98 0l.41 1.42a2.5 2.5 0 001.91 1.91l1.42.41a.5.5 0 010 .98l-1.42.41a2.5 2.5 0 00-1.91 1.91l-.41 1.42a.5.5 0 01-.98 0l-.41-1.42a2.5 2.5 0 00-1.91-1.91l-1.42-.41a.5.5 0 010-.98l1.42.41a2.5 2.5 0 001.91-1.91z" /></svg></IconWrapper>;
const UserCheckIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h-3m-1.5-4.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0" /></svg></IconWrapper>;
const UserGroupIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM10.5 15a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm10.5-9.75h-5.625c-.621 0-1.125.504-1.125 1.125v1.125c0 .621.504 1.125 1.125 1.125h5.625c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125z" /></svg></IconWrapper>;
const UsersIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.598M12 14.25a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z" /></svg></IconWrapper>;
const XCircleIcon = () => <IconWrapper className="h-5 w-5 text-red-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></IconWrapper>;
const CheckCircleIcon = () => <IconWrapper className="h-5 w-5 text-green-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></IconWrapper>;
const PlusCircleIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></IconWrapper>;


//================================================================
// UTILITY FUNCTIONS
//================================================================
const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        // You can add a notification here if you want
        console.log("Copied to clipboard");
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


//================================================================
// ERROR BOUNDARY
//================================================================
class ErrorBoundary extends Component<PropsWithChildren<{}>, { hasError: boolean; error?: Error }> {
  // Fix: Initialize state as a class property to avoid issues with `this` context.
  state = { hasError: false, error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/40 border border-red-700 rounded-2xl text-red-50 space-y-3">
          <div className="flex items-center gap-2">
            <XCircleIcon />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-red-300">System alert</p>
              <p className="text-lg font-semibold">Something went off-beat</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-red-200">
            {this.state.error?.message ?? "An unexpected error occurred. Please try again."}
          </p>
          <button
            className="px-3 py-1.5 rounded-lg bg-red-700/50 hover:bg-red-600/60 text-sm font-medium transition"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Reset view
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const GEMINI_MODEL = "gemini-1.5-flash";
type DashboardSectionKey = keyof DashboardData;

const defaultDashboardData: DashboardData = {
  audience: {
    artistName: "Organic Don't Panic",
    artistInfo: "Neo-soul collective weaving analog tape textures with eco-futurist storytelling.",
    demographics: {
      ageRange: "18-34",
      gender: "55% women / 40% men / 5% non-binary",
      topCountries: ["United States", "Brazil", "United Kingdom"],
      primaryLanguage: "English"
    },
    psychographics: {
      interests: ["Modular synth jams", "Eco-fashion", "Analog photography"],
      values: ["Sustainability", "Audience co-creation", "Experimental sound"],
      personalityTraits: ["Curious", "Community-driven", "Trendsetting"]
    },
    onlineBehavior: {
      socialMediaUsage: ["Late-night TikTok live jams", "Instagram stories", "Discord listening parties"],
      preferredContent: ["Behind-the-scenes loops", "Visual art drops", "Voice-note demos"],
      onlineShopping: "Limited merch capsules via Shopify and Discord-only drops"
    }
  },
  insights: [
    {
      title: "Eco-futurist story resonates",
      description: "Fans cite tactile visuals + recycled fabrics as the reason they stay loyal.",
      actionable_advice: "Pair every merch drop with a short film documenting the build."
    },
    {
      title: "Discord drives conversion",
      description: "Top patrons live in the Greenhouse community and expect weekly rituals.",
      actionable_advice: "Host a 20-minute studio debrief every Sunday night."
    }
  ],
  marketAnalysis: {
    swot: {
      strengths: ["Distinct eco narrative", "High community engagement"],
      weaknesses: ["Limited paid media"],
      opportunities: ["Sync placements", "Climate brand collabs"],
      threats: ["Major labels replicating messaging"]
    },
    competitors: [
      { name: "Glass Gardens", strengths: "Large playlist reach", weaknesses: "Less authentic" },
      { name: "Future Flora", strengths: "AR visuals", weaknesses: "Inconsistent drops" }
    ],
    market_trends: ["Eco story-driven pop", "Analog nostalgia"],
    target_platforms: ["TikTok LIVE", "YouTube Shorts", "Audius"]
  },
  contentPlan: {
    content_pillars: ["Process Documentary", "Community Calls", "Eco-Tech Story"],
    content_ideas: [
      { platform: "Instagram", idea: "Analog lab carousel", format: "Carousel", potential_impact: "Community depth" },
      { platform: "TikTok", idea: "30s tape-loop challenge", format: "Vertical video", potential_impact: "Top funnel" }
    ],
    posting_schedule: {
      platform: "TikTok",
      frequency: "4x weekly",
      best_time_to_post: "10pm-1am PST"
    }
  },
  pressRelease: {
    headline: "Organic Don't Panic Ignite the Solar Bloom Era",
    subheadline: "Neo-soul futurists blend analog warmth with AI-crafted visuals for their boldest chapter.",
    body: [
      "Organic Don't Panic announce 'Solar Bloom', a multi-sensory project merging biodegradable merch, AI-assisted music videos, and community-authored lore.",
      "The rollout features collaborations with eco-architect Lina Kori and choreographer MSDK alongside immersive premieres at the EcoSphere residency."
    ].join("\n\n"),
    boilerplate: "Organic Don't Panic craft future-facing neo-soul experiences that merge analog tape work with speculative eco-fiction.",
    contact_info: "Press: Nova Reyes / nova@prismtone.agency"
  },
  financialPlan: {
    revenue_streams: [
      { stream: "Limited vinyl capsules", short_term_potential: "300-unit sell out", long_term_potential: "Subscription vinyl club" },
      { stream: "Immersive residencies", short_term_potential: "High-margin pop-ups", long_term_potential: "Global EcoSphere franchise" }
    ],
    budget_allocation: [
      { category: "Visual R&D", percentage: 28, notes: "Projection mapping, AI comps" },
      { category: "Community", percentage: 22, notes: "Discord concierge, SMS club" },
      { category: "Paid pilots", percentage: 12, notes: "Spark ads w/ micro-creators" },
      { category: "Touring", percentage: 25, notes: "Modular residencies" },
      { category: "Buffer", percentage: 13, notes: "Fabrication risk" }
    ],
    financial_goals: [
      "Grow DTC revenue to $120k during Solar Bloom",
      "Convert 1,500 superfans into paid tiers"
    ]
  },
  summitScore: {
    score: 84,
    explanation: "Strong community velocity and differentiated IP; scale via LATAM partnerships.",
    areas_for_improvement: ["Merch logistics", "Sync-ready instrumentals"]
  },
  masterProposal: {
    title: "Solar Bloom Experience Stack",
    executive_summary: "A modular campaign blueprint that stitches together music releases, tactile merch, and living stories inside the Greenhouse community.",
    sections: [
      { title: "Narrative Spine", content: "Solar Bloom imagines a future city powered by sound gardens." },
      { title: "Audience Flywheel", content: "Discord labs → TikTok teasers → IRL installations." }
    ]
  },
  releasePlan: {
    artistName: "Organic Don't Panic",
    releaseTitle: "Solar Bloom EP",
    releaseDate: "2025-02-21T12:00:00.000Z",
    timeframes: [
      {
        title: "T-60 Foundation",
        groups: [
          {
            category: "Story seeding",
            items: [
              { text: "Tease lore via analog postcards", completed: true },
              { text: "Open Discord lore-room for canon", completed: false }
            ]
          },
          {
            category: "Data sprint",
            items: [
              { text: "Survey top patrons about pricing", completed: false },
              { text: "Paid test on eco-fashion audiences", completed: true }
            ]
          }
        ]
      },
      {
        title: "T-30 Momentum",
        groups: [
          {
            category: "Content",
            items: [
              { text: "Release 'Bloom Spores' trilogy", completed: false },
              { text: "Launch duet challenge", completed: false }
            ]
          },
          {
            category: "Community rituals",
            items: [
              { text: "Host Solar Bloom council on Discord", completed: false },
              { text: "Unlock AR poster drop", completed: false }
            ]
          }
        ]
      }
    ]
  },
  fanMailAnalysis: {
    sentiment: [
      { name: "Joy", value: 62 },
      { name: "Nostalgia", value: 24 },
      { name: "Concern", value: 14 }
    ],
    keyThemes: [
      "Fans crave more behind-the-song context",
      "High demand for LATAM tour dates"
    ],
    suggestedReplies: [
      { category: "LATAM fans", text: "We're prototyping a Sao Paulo micro-residency—drop your city in the form." },
      { category: "Merch love", text: "Glad you felt the tapestries! Next drop explores dyes made from studio plants." }
    ],
    contentIdeas: [
      "Voice memo breakdown of 'Photosynthesize'",
      "Livestream the biodegradable merch build"
    ]
  },
  royaltySplits: [
    {
      id: 1,
      songTitle: "Solar Bloom",
      collaborators: [
        { name: "KORA", contribution: "Production", percentage: 35 },
        { name: "Jules Mesa", contribution: "Lyrics / Vocals", percentage: 35 },
        { name: "Mira W.", contribution: "Strings", percentage: 15 },
        { name: "Lumen Labs", contribution: "Sound design", percentage: 15 }
      ],
      isFinalized: false
    },
    {
      id: 2,
      songTitle: "Photosynthesize",
      collaborators: [
        { name: "KORA", contribution: "Production", percentage: 30 },
        { name: "Jules Mesa", contribution: "Lyrics / Vocals", percentage: 40 },
        { name: "STN Hill", contribution: "Bass / Co-write", percentage: 20 },
        { name: "NOVA", contribution: "Percussion", percentage: 10 }
      ],
      isFinalized: true
    }
  ],
  brandKit: {
    brand_statement: "We create living neo-soul rituals that treat sustainability as a stage prop.",
    color_palettes: [
      { name: "Solar Core", colors: ["#FFE55C", "#FF9B42", "#141414"] },
      { name: "Greenhouse", colors: ["#CDF567", "#4B854C", "#0F1A12"] }
    ],
    font_pairings: [
      { headline: "Space Grotesk", body: "IBM Plex Mono" },
      { headline: "GT Alpina", body: "Inter" }
    ],
    logo_prompts: [
      "Circular emblem with intertwining vines around a cassette icon",
      "Wordmark that looks etched into recycled glass"
    ]
  },
  artworkAnalysis: {
    analysisA: "Poster A leans cinematic with gold gradients and macro plant veins—evokes optimism.",
    analysisB: "Poster B is cooler, glitchier, full of glass refractions and nightlife energy.",
    recommendation: "Use Poster A for press + physical stores, Poster B for club promoters.",
    winner: "A",
    imageA_url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
    imageB_url: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=900&q=80"
  }
};

const SECTION_CONFIG: Array<{
  key: DashboardSectionKey;
  label: string;
  description: string;
  prompt: string;
  icon: ReactNode;
}> = [
  {
    key: "audience",
    label: "Audience Genome",
    description: "Refresh demographic + psychographic map.",
    prompt: "Return JSON with an 'audience' object respecting the Audience interface.",
    icon: <UsersIcon />
  },
  {
    key: "insights",
    label: "Strategic Insights",
    description: "Synthesize the latest cultural signals.",
    prompt: "Return JSON with {\"insights\": Insight[]} describing up to 3 takeaways.",
    icon: <LightBulbIcon />
  },
  {
    key: "releasePlan",
    label: "Release Timeline",
    description: "Update milestones for the Solar Bloom launch.",
    prompt: "Return JSON with a 'releasePlan' object formatted per the ReleasePlan interface.",
    icon: <CalendarDaysIcon />
  },
  {
    key: "financialPlan",
    label: "Financial Stack",
    description: "Budget, revenue, and goals snapshot.",
    prompt: "Return JSON with {\"financialPlan\": FinancialPlan} packed with numbers.",
    icon: <ChartBarIcon />
  },
  {
    key: "fanMailAnalysis",
    label: "Fan Pulse",
    description: "Summarize inbound messages & recommended replies.",
    prompt: "Return JSON with 'fanMailAnalysis' capturing sentiment, themes, replies, and ideas.",
    icon: <ChatBubbleOvalLeftEllipsisIcon />
  },
  {
    key: "royaltySplits",
    label: "Split Doctor",
    description: "Propose equitable royalty splits for new demos.",
    prompt: "Return JSON with {\"royaltySplits\": RoyaltySplit[]} and ensure totals = 100.",
    icon: <ScaleIcon />
  },
  {
    key: "brandKit",
    label: "Brand Texture",
    description: "Recolor the visual system for new drops.",
    prompt: "Return JSON with {\"brandKit\": BrandKit} including palettes, fonts, and logo prompts.",
    icon: <SparklesIcon />
  },
  {
    key: "pressRelease",
    label: "Press Pulse",
    description: "Generate a concise story pitch.",
    prompt: "Return JSON with {\"pressRelease\": PressRelease}. Body should be markdown friendly.",
    icon: <NewspaperIcon />
  },
  {
    key: "dealMemoAnalysis",
    label: "Deal Lens",
    description: "Stress-test new contract offer terms.",
    prompt: "Return JSON with {\"dealMemoAnalysis\": DealMemoAnalysis} highlighting red flags.",
    icon: <ClipboardListIcon />
  },
  {
    key: "artworkAnalysis",
    label: "Artwork Arena",
    description: "Compare A/B visuals and recommend usage.",
    prompt: "Return JSON with {\"artworkAnalysis\": ArtworkAnalysis}.",
    icon: <ClipboardIcon />
  }
];

const GUIDES: Guide[] = [
  {
    id: "initial",
    title: "Welcome to the Greenhouse war room",
    description: "Track every lever for the Solar Bloom era from one surface.",
    unlocksWith: "initial",
    icon: <SparklesIcon />,
    content: "Use the action launcher to regenerate insights, briefs, and splits. Each section logs when it was refreshed so you can communicate confidently."
  },
  {
    id: "audience",
    title: "Grow the Discord flywheel",
    description: "Audience updates unlock new guide steps.",
    unlocksWith: "audience",
    icon: <UserGroupIcon />,
    content: "Pair every Discord ritual with a collectible artifact. Pin prompts so newcomers instantly participate."
  },
  {
    id: "releasePlan",
    title: "Release runway blueprint",
    description: "Update the timeline to reveal this playbook.",
    unlocksWith: "releasePlan",
    icon: <CalendarDaysIcon />,
    content: "Bucket to-dos into Foundation, Momentum, and Conversion waves. Each wave should include one community, one paid, and one experiential lever."
  },
  {
    id: "royaltySplits",
    title: "Split diplomacy cheat sheet",
    description: "Activated when new splits are proposed.",
    unlocksWith: "royaltySplits",
    icon: <ScaleIcon />,
    content: "Document creative contributions during sessions. Capture intangible value like community A&R or live arrangement." 
  }
];

const formatPercentage = (value: number) => `${value.toFixed(0)}%`;

const MetricTag: FC<PropsWithChildren<{ tone?: "default" | "success" | "danger" }>> = ({ children, tone = "default" }) => {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/40"
      : tone === "danger"
      ? "bg-red-500/10 text-red-200 border-red-500/40"
      : "bg-white/5 text-white border-white/10";
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${toneClasses}`}>{children}</span>;
};

const SectionCard: FC<
  PropsWithChildren<{
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    isLoading?: boolean;
    error?: string | null;
  }>
> = ({ title, subtitle, icon, actions, isLoading, error, children }) => (
  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-[0_20px_100px_rgba(0,0,0,0.45)] backdrop-blur">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.25em] text-white/60">
          {icon}
          {title}
        </div>
        {subtitle && <p className="text-white/70 text-sm mt-2">{subtitle}</p>}
      </div>
      {actions}
    </div>
    {isLoading ? (
      <div className="mt-6 flex items-center gap-3 text-sm text-sky-200">
        <span className="h-2 w-2 rounded-full bg-sky-300 animate-ping" />
        Updating with Gemini...
      </div>
    ) : error ? (
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        <XCircleIcon />
        {error}
      </div>
    ) : (
      <div className="mt-6 space-y-4">{children}</div>
    )}
  </div>
);

const MarkdownPreview: FC<{ value?: string }> = ({ value }) => {
  if (!value) return <p className="text-white/50 text-sm">No copy yet.</p>;
  return (
    <div
      className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-white/80 prose-strong:text-white"
      dangerouslySetInnerHTML={{ __html: marked.parse(value) }}
    />
  );
};

const SentimentBar: FC<{ data?: { name: string; value: number }[] }> = ({ data }) => {
  if (!data?.length) return <p className="text-white/50 text-sm">No sentiment data.</p>;
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.name}>
          <div className="flex justify-between text-xs text-white/60">
            <span>{item.name}</span>
            <span>{item.value}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-purple-400" style={{ width: `${item.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const NotificationToast: FC<{ notification: AppNotification; onDismiss: (id: number) => void }> = ({ notification, onDismiss }) => {
  const tone =
    notification.type === "success"
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
      : "border-yellow-500/40 bg-yellow-500/10 text-yellow-100";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm flex items-start gap-3 ${tone}`}>
      <div className="flex-1">{notification.message}</div>
      <button className="text-xs uppercase tracking-wide" onClick={() => onDismiss(notification.id)}>
        Close
      </button>
    </div>
  );
};

const buildFallbackFor = (key: DashboardSectionKey, artist: string, goal: string): Partial<DashboardData> => {
  const refreshedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  switch (key) {
    case "audience":
      return {
        audience: {
          artistName: artist,
          artistInfo: `${artist} community pulse refreshed at ${refreshedAt}.`,
          demographics: {
            ageRange: "16-32",
            gender: "Fluid mix led by femmes and non-binary fans",
            topCountries: ["United States", "Mexico", "Spain"],
            primaryLanguage: "English + Portuguese"
          },
          psychographics: {
            interests: ["Strange pop", "Zero-waste fashion", "Nature documentaries"],
            values: ["Co-creation", "Tech optimism", "Grassroots wins"],
            personalityTraits: ["Playful", "Tactile", "Resilient"]
          },
          onlineBehavior: {
            socialMediaUsage: ["Late-night Reddit threads", "Collective playlists", "Live sketch streams"],
            preferredContent: ["Voice note demos", "Polaroid scans", "Studio rituals"],
            onlineShopping: "Micro-drops of upcycled goods via gated storefronts"
          }
        }
      };
    case "insights":
      return {
        insights: [
          {
            title: "Fans want proof-of-progress",
            description: "Short clips showing how the mission \"${goal}\" evolves keep watch time high.",
            actionable_advice: "Post a 45s desk vlog every Wednesday recapping experiments."
          },
          {
            title: "More bilingual touchpoints",
            description: "Dual-language captions double completion rates in LATAM.",
            actionable_advice: "Translate hooks + story beats and drop them as carousels."
          }
        ]
      };
    case "releasePlan":
      return {
        releasePlan: {
          artistName: artist,
          releaseTitle: goal || "Next Era",
          releaseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          timeframes: [
            {
              title: "Signal Boost",
              groups: [
                {
                  category: "Community",
                  items: [
                    { text: "Host progress AMA inside Discord", completed: false },
                    { text: "Publish lore postcard for top supporters", completed: true }
                  ]
                }
              ]
            },
            {
              title: "Conversion Lift",
              groups: [
                {
                  category: "Experiential",
                  items: [
                    { text: "Launch IRL pop-up with bio art installation", completed: false },
                    { text: "Bundle merch + virtual huddle passes", completed: false }
                  ]
                }
              ]
            }
          ]
        }
      };
    case "financialPlan":
      return {
        financialPlan: {
          revenue_streams: [
            { stream: "Fan club tiers", short_term_potential: "50 new members", long_term_potential: "Recurring $8k/mo" }
          ],
          budget_allocation: [
            { category: "Community", percentage: 30, notes: "Concierge + tooling" },
            { category: "Content", percentage: 40, notes: "Shoots + post" },
            { category: "Buffer", percentage: 30, notes: "Fabrication swings" }
          ],
          financial_goals: [
            "Close 2 co-marketing partners",
            "Maintain 65% gross margin on drops"
          ]
        }
      };
    case "fanMailAnalysis":
      return {
        fanMailAnalysis: {
          sentiment: [
            { name: "Excitement", value: 58 },
            { name: "Curiosity", value: 27 },
            { name: "Concern", value: 15 }
          ],
          keyThemes: ["Fans want localized events", "Collectors crave more behind-the-scenes"],
          suggestedReplies: [
            { category: "Community", text: "We're piloting city hosts—drop your crew + location to unlock meetups." }
          ],
          contentIdeas: ["30s gratitude loop using real fan DMs"]
        }
      };
    case "royaltySplits":
      return {
        royaltySplits: [
          {
            id: Date.now(),
            songTitle: `${goal || "New Era"} Theme`,
            collaborators: [
              { name: artist, contribution: "Concept / Topline", percentage: 40 },
              { name: "Community Writers", contribution: "Lyric prompts", percentage: 10 },
              { name: "Modular Collective", contribution: "Production", percentage: 35 },
              { name: "Mix Wing", contribution: "Mix / Master", percentage: 15 }
            ],
            isFinalized: false
          }
        ]
      };
    case "brandKit":
      return {
        brandKit: {
          brand_statement: `${artist} expresses future-nature energy through tactile, regenerative design.`,
          color_palettes: [{ name: "Dusk Bloom", colors: ["#FFB347", "#FFCC33", "#1A1F2B"] }],
          font_pairings: [{ headline: "Whyte Inktrap", body: "ABC Diatype" }],
          logo_prompts: ["Glyph merging a leaf + glittering cassette"]
        }
      };
    case "pressRelease":
      return {
        pressRelease: {
          headline: `${artist} enter their ${goal || "new"} era`,
          subheadline: "Community-authored eco-futurist project lands this season.",
          body: `### ${artist}\n\n${goal} receives a refreshed blueprint at ${refreshedAt}.`,
          boilerplate: `${artist} craft sensory-rich neo-soul experiences.`,
          contact_info: "press@organicdontpanic.fm"
        }
      };
    case "dealMemoAnalysis":
      return {
        dealMemoAnalysis: {
          summary: "Offer includes flexible marketing coop but hazy merch clauses.",
          key_terms: [{ term: "Reporting cadence", explanation: "Shift to monthly with automated dashboards." }],
          red_flags: ["Exclusivity on immersive events"]
        }
      };
    case "artworkAnalysis":
      return {
        artworkAnalysis: {
          analysisA: "A leans ritualistic with sunset gradients.",
          analysisB: "B is metallic with glitch fragments.",
          recommendation: "Use A for press, B for nightlife.",
          winner: "A",
          imageA_url: defaultDashboardData.artworkAnalysis?.imageA_url ?? "",
          imageB_url: defaultDashboardData.artworkAnalysis?.imageB_url ?? ""
        }
      };
    default:
      return {};
  }
};

const extractJsonBlock = (text: string, key: DashboardSectionKey) => {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed[key] ? { [key]: parsed[key] } : parsed;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return parsed[key] ? { [key]: parsed[key] } : parsed;
    } catch {
      return null;
    }
  }
};

const App: FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});
  const [errorStates, setErrorStates] = useState<ErrorStates>({});
  const [artistName, setArtistName] = useState(defaultDashboardData.audience?.artistName ?? "Organic Don't Panic");
  const [campaignGoal, setCampaignGoal] = useState("Launch the Solar Bloom era");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Ready to orchestrate the next move. What should we tackle?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [activeGuideId, setActiveGuideId] = useState(GUIDES[0]?.id ?? "initial");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [artworkUploads, setArtworkUploads] = useState<{ a?: string; b?: string }>({});
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const geminiClientRef = useRef<GoogleGenAI | null>(null);

  const releaseCountdown = useMemo(() => {
    if (!dashboardData.releasePlan?.releaseDate) return null;
    const releaseDate = new Date(dashboardData.releasePlan.releaseDate);
    if (Number.isNaN(releaseDate.getTime())) return null;
    const diff = releaseDate.getTime() - Date.now();
    const days = Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
    return {
      days,
      formatted: releaseDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    };
  }, [dashboardData.releasePlan?.releaseDate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const metaEnv = (import.meta as any)?.env ?? {};
    const apiKey =
      (window as any).GEMINI_API_KEY ??
      metaEnv.VITE_GEMINI_API_KEY ??
      metaEnv.GEMINI_API_KEY ??
      metaEnv.PUBLIC_GEMINI_API_KEY;
    if (apiKey && !geminiClientRef.current) {
      geminiClientRef.current = new GoogleGenAI({ apiKey });
    }
  }, []);

  const pushNotification = useCallback((message: string, type: AppNotification["type"] = "success") => {
    setNotifications((prev) => [...prev.slice(-2), { id: Date.now(), message, type }]);
  }, []);

  const dismissNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const runGemini = useCallback(
    async (prompt: string): Promise<string> => {
      if (!geminiClientRef.current) {
        throw new Error("Gemini API key missing. Add GEMINI_API_KEY to your environment.");
      }
      const model = geminiClientRef.current.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(prompt);
      return result.response.text() ?? "";
    },
    []
  );

  const handleGenerateSection = useCallback(
    async (key: DashboardSectionKey) => {
      setLoadingStates((prev) => ({ ...prev, [key]: true }));
      setErrorStates((prev) => ({ ...prev, [key]: null }));
      const config = SECTION_CONFIG.find((entry) => entry.key === key);
      const prompt = config
        ? `You are an elite music strategy co-pilot helping ${artistName} with \"${campaignGoal}\". Respond with JSON only. ${config.prompt}`
        : "";
      try {
        const response = prompt ? await runGemini(prompt) : "";
        const parsed = extractJsonBlock(response, key);
        const payload = (parsed as Partial<DashboardData>) ?? buildFallbackFor(key, artistName, campaignGoal);
        setDashboardData((prev) => ({ ...prev, ...payload }));
        pushNotification(`${config?.label ?? key} refreshed.`);
      } catch (error) {
        const fallback = buildFallbackFor(key, artistName, campaignGoal);
        setDashboardData((prev) => ({ ...prev, ...fallback }));
        setErrorStates((prev) => ({ ...prev, [key]: (error as Error).message }));
        pushNotification(`Used offline playbook for ${config?.label ?? key}.`, "error");
      } finally {
        setLoadingStates((prev) => ({ ...prev, [key]: false }));
      }
    },
    [artistName, campaignGoal, pushNotification, runGemini]
  );

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;
    const nextMessage: ChatMessage = { role: "user", content: chatInput.trim() };
    setChatMessages((prev) => [...prev, nextMessage]);
    setChatInput("");
    setIsChatSending(true);
    const contextPrompt = `Act as a senior music strategist for ${artistName}. Campaign goal: ${campaignGoal}. Keep answers concise but specific.`;
    try {
      const reply = await runGemini(`${contextPrompt}\n\nQuestion: ${nextMessage.content}`);
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply || "Processing complete." }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Offline mode: refresh fan pulse and release timeline next to keep momentum."
        }
      ]);
    } finally {
      setIsChatSending(false);
    }
  }, [chatInput, artistName, campaignGoal, runGemini]);

  const handleChatKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleArtistChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setArtistName(event.target.value);
  }, []);

  const handleGoalChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCampaignGoal(event.target.value);
  }, []);

  const handleArtworkUpload = useCallback(
    (slot: "A" | "B") =>
      async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const base64 = await fileToBase64(file);
        setArtworkUploads((prev) => ({ ...prev, [slot === "A" ? "a" : "b"]: base64 }));
        setDashboardData((prev) => ({
          ...prev,
          artworkAnalysis: {
            ...(prev.artworkAnalysis ?? defaultDashboardData.artworkAnalysis),
            [slot === "A" ? "imageA_url" : "imageB_url"]: base64
          }
        }));
        pushNotification(`Artwork ${slot} updated.`);
      },
    [pushNotification]
  );

  const handleExportDashboard = useCallback(async () => {
    const target = document.getElementById("dashboard-root");
    const html2canvas = (window as any).html2canvas;
    const jsPDF = window.jspdf?.jsPDF;
    if (!target || !html2canvas || !jsPDF) {
      pushNotification("Export tools unavailable in this environment.", "error");
      return;
    }
    const canvas = await html2canvas(target, { backgroundColor: "#050505", scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = 190;
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, 10, width, height);
    pdf.save(`${artistName.toLowerCase().replace(/\s+/g, "-")}-dashboard.pdf`);
    pushNotification("Dashboard exported to PDF.");
  }, [artistName, pushNotification]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8" id="dashboard-root">
        <header className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Organic Don't Panic · Solar Bloom</p>
            <h1 className="text-3xl md:text-4xl font-semibold mt-2">Career Co-Pilot</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            {releaseCountdown && (
              <MetricTag tone="success">{releaseCountdown.days} days to launch ({releaseCountdown.formatted})</MetricTag>
            )}
            <MetricTag>{dashboardData.summitScore?.score ?? 0} Summit score</MetricTag>
            <button
              onClick={handleExportDashboard}
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/5 transition"
            >
              <ArrowDownTrayIcon />
              Export war room
            </button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Artist / Project
            <input
              value={artistName}
              onChange={handleArtistChange}
              className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="Artist name"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Campaign focus
            <input
              value={campaignGoal}
              onChange={handleGoalChange}
              className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="Launch plan"
            />
          </label>
        </div>

        <div className="grid lg:grid-cols-[3fr_1.2fr] gap-6">
          <div className="space-y-6">
            <SectionCard
              title="Audience Intelligence"
              subtitle="Demographic, psychographic, and behavior stack"
              icon={<UsersIcon />}
              actions={
                <button className="text-sm underline text-white/70" onClick={() => handleGenerateSection("audience")}>
                  Refresh
                </button>
              }
              isLoading={loadingStates.audience}
              error={errorStates.audience}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Profile</p>
                  <p className="text-lg font-semibold">{dashboardData.audience?.artistName}</p>
                  <p className="text-sm text-white/70">{dashboardData.audience?.artistInfo}</p>
                  <div className="text-xs text-white/50 space-y-1">
                    <p>Age range: {dashboardData.audience?.demographics.ageRange}</p>
                    <p>Top regions: {(dashboardData.audience?.demographics.topCountries ?? []).join(", ")}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Psychographics</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(dashboardData.audience?.psychographics.interests ?? []).map((interest) => (
                      <MetricTag key={interest}>{interest}</MetricTag>
                    ))}
                  </div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50 mt-4">Online rituals</p>
                  <ul className="text-sm text-white/70 list-disc pl-4 mt-2 space-y-1">
                    {(dashboardData.audience?.onlineBehavior.socialMediaUsage ?? []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Strategic Insights"
              subtitle="What fans, press, and partners are signaling"
              icon={<LightBulbIcon />}
              actions={
                <button className="text-sm underline text-white/70" onClick={() => handleGenerateSection("insights")}>
                  Refresh
                </button>
              }
              isLoading={loadingStates.insights}
              error={errorStates.insights}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {(dashboardData.insights ?? []).map((insight) => (
                  <div key={insight.title} className="border border-white/10 rounded-2xl p-4 bg-white/3">
                    <p className="text-sm font-semibold">{insight.title}</p>
                    <p className="text-sm text-white/70 mt-2">{insight.description}</p>
                    <p className="text-xs text-emerald-200 mt-3">{insight.actionable_advice}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Release Plan"
              subtitle="Milestones across foundation, momentum, conversion"
              icon={<CalendarDaysIcon />}
              actions={
                <button className="text-sm underline text-white/70" onClick={() => handleGenerateSection("releasePlan")}>
                  Refresh
                </button>
              }
              isLoading={loadingStates.releasePlan}
              error={errorStates.releasePlan}
            >
              <div className="space-y-4">
                {(dashboardData.releasePlan?.timeframes ?? []).map((timeframe) => (
                  <div key={timeframe.title} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{timeframe.title}</p>
                      <MetricTag tone="success">
                        {
                          timeframe.groups
                            .flatMap((group) => group.items)
                            .filter((item) => item.completed).length
                        }
                        /
                        {timeframe.groups.reduce((acc, group) => acc + group.items.length, 0)} complete
                      </MetricTag>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      {timeframe.groups.map((group) => (
                        <div key={group.category} className="bg-white/5 rounded-xl p-4 space-y-2">
                          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{group.category}</p>
                          <ul className="text-sm text-white/80">
                            {group.items.map((item) => (
                              <li key={item.text} className="flex items-start gap-2 py-1">
                                <span className={`mt-1 h-2 w-2 rounded-full ${item.completed ? "bg-emerald-400" : "bg-white/30"}`} />
                                {item.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Financial + Deal Lens"
              subtitle="How we fund Solar Bloom and protect leverage"
              icon={<CurrencyDollarIcon />}
              actions={
                <div className="flex gap-2">
                  <button className="text-sm underline text-white/70" onClick={() => handleGenerateSection("financialPlan")}>
                    Update budget
                  </button>
                  <button className="text-sm underline text-white/70" onClick={() => handleGenerateSection("dealMemoAnalysis")}>
                    Analyze deal
                  </button>
                </div>
              }
              isLoading={loadingStates.financialPlan || loadingStates.dealMemoAnalysis}
              error={errorStates.financialPlan || errorStates.dealMemoAnalysis}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Budget allocation</p>
                  <div className="space-y-3 mt-3">
                    {(dashboardData.financialPlan?.budget_allocation ?? []).map((bucket) => (
                      <div key={bucket.category} className="flex items-center justify-between text-sm">
                        <span>{bucket.category}</span>
                        <span>{formatPercentage(bucket.percentage)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Deal memo</p>
                  <p className="text-sm text-white/70">{dashboardData.dealMemoAnalysis?.summary}</p>
                  <ul className="text-xs text-yellow-200 list-disc pl-4">
                    {(dashboardData.dealMemoAnalysis?.red_flags ?? []).map((flag) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Press Narrative"
              subtitle="Story pitch ready for partners and press"
              icon={<NewspaperIcon />}
              actions={
                <button className="text-sm underline text-white/70" onClick={() => handleGenerateSection("pressRelease")}>
                  Refresh copy
                </button>
              }
              isLoading={loadingStates.pressRelease}
              error={errorStates.pressRelease}
            >
              <div className="space-y-3">
                <p className="text-2xl font-semibold">{dashboardData.pressRelease?.headline}</p>
                <p className="text-sm text-white/70">{dashboardData.pressRelease?.subheadline}</p>
                <MarkdownPreview value={dashboardData.pressRelease?.body} />
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => copyToClipboard(dashboardData.pressRelease?.body ?? "")}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/5 transition"
                  >
                    Copy body
                  </button>
                  <MetricTag>{dashboardData.pressRelease?.contact_info}</MetricTag>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Community Pulse"
              subtitle="Fan sentiment, suggested replies, and content prompts"
              icon={<ChatBubbleOvalLeftEllipsisIcon />}
              actions={
                <button className="text-sm underline text-white/70" onClick={() => handleGenerateSection("fanMailAnalysis")}>
                  Refresh
                </button>
              }
              isLoading={loadingStates.fanMailAnalysis}
              error={errorStates.fanMailAnalysis}
            >
              <div className="grid md:grid-cols-3 gap-4">
                <SentimentBar data={dashboardData.fanMailAnalysis?.sentiment} />
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Themes</p>
                  <ul className="text-sm text-white/80 list-disc pl-4 space-y-1">
                    {(dashboardData.fanMailAnalysis?.keyThemes ?? []).map((theme) => (
                      <li key={theme}>{theme}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Suggested replies</p>
                  <ul className="text-sm text-white/80 space-y-2">
                    {(dashboardData.fanMailAnalysis?.suggestedReplies ?? []).map((reply) => (
                      <li key={reply.text} className="rounded-xl bg-white/5 p-3">
                        <p className="font-semibold text-xs text-white/50">{reply.category}</p>
                        <p>{reply.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Royalty Splits"
              subtitle="Draft + finalized collaborator splits"
              icon={<ScaleIcon />}
              actions={
                <button className="text-sm underline text-white/70" onClick={() => handleGenerateSection("royaltySplits")}>
                  Propose new split
                </button>
              }
              isLoading={loadingStates.royaltySplits}
              error={errorStates.royaltySplits}
            >
              <div className="space-y-4">
                {(dashboardData.royaltySplits ?? []).map((split) => (
                  <div key={split.id} className="border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{split.songTitle}</p>
                      <MetricTag tone={split.isFinalized ? "success" : "danger"}>
                        {split.isFinalized ? "Finalized" : "Draft"}
                      </MetricTag>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm">
                      {split.collaborators.map((collab) => (
                        <li key={collab.name} className="flex items-center justify-between">
                          <span>{collab.name}</span>
                          <span>{collab.contribution}</span>
                          <span>{collab.percentage}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Brand Texture"
              subtitle="Palettes, fonts, and logo prompts"
              icon={<SparklesIcon />}
              actions={
                <button className="text-sm underline text-white/70" onClick={() => handleGenerateSection("brandKit")}>
                  Refresh kit
                </button>
              }
              isLoading={loadingStates.brandKit}
              error={errorStates.brandKit}
            >
              <div className="grid md:grid-cols-2 gap-4">
                {(dashboardData.brandKit?.color_palettes ?? []).map((palette) => (
                  <div key={palette.name} className="rounded-2xl border border-white/10 p-4">
                    <p className="text-sm font-semibold">{palette.name}</p>
                    <div className="flex gap-2 mt-3">
                      {palette.colors.map((color) => (
                        <div key={color} className="flex-1 h-12 rounded-xl border border-white/10" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Fonts</p>
                  <ul className="text-sm text-white/80 space-y-1">
                    {(dashboardData.brandKit?.font_pairings ?? []).map((pair) => (
                      <li key={`${pair.headline}-${pair.body}`}>
                        <strong>{pair.headline}</strong> + {pair.body}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Logo prompts</p>
                  <ul className="text-sm text-white/80 list-disc pl-4 space-y-1">
                    {(dashboardData.brandKit?.logo_prompts ?? []).map((prompt) => (
                      <li key={prompt}>{prompt}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Artwork Arena"
              subtitle="Compare visual directions & upload new comps"
              icon={<ClipboardIcon />}
              actions={
                <button className="text-sm underline text-white/70" onClick={() => handleGenerateSection("artworkAnalysis")}>
                  Refresh analysis
                </button>
              }
              isLoading={loadingStates.artworkAnalysis}
              error={errorStates.artworkAnalysis}
            >
              <div className="grid md:grid-cols-2 gap-4">
                {(["A", "B"] as const).map((slot) => {
                  const key = slot === "A" ? "imageA_url" : "imageB_url";
                  return (
                    <div key={slot} className="space-y-3">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        {slot === "A" ? "Poster A" : "Poster B"}
                        {dashboardData.artworkAnalysis?.winner === slot && <MetricTag tone="success">Rec</MetricTag>}
                      </p>
                      <div className="aspect-[4/3] rounded-2xl border border-white/10 overflow-hidden bg-white/5">
                        <img
                          src={dashboardData.artworkAnalysis?.[key] || artworkUploads[slot === "A" ? "a" : "b"]}
                          alt={`Artwork ${slot}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <input type="file" accept="image/*" onChange={handleArtworkUpload(slot)} className="text-xs text-white/60" />
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
                <p>{dashboardData.artworkAnalysis?.recommendation}</p>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Action launcher</p>
              <div className="mt-4 space-y-4">
                {SECTION_CONFIG.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => handleGenerateSection(section.key)}
                    className="w-full flex items-start gap-3 rounded-2xl border border-white/10 px-4 py-3 text-left hover:bg-white/5 transition"
                  >
                    <div className="mt-1">{section.icon}</div>
                    <div>
                      <p className="text-sm font-semibold">{section.label}</p>
                      <p className="text-xs text-white/60">{section.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Co-pilot chat</p>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl px-4 py-3 text-sm ${message.role === "user" ? "bg-sky-500/10 border border-sky-500/20" : "bg-white/5 border border-white/10"}`}
                  >
                    <p className="text-xs uppercase tracking-[0.4em] text-white/40">{message.role}</p>
                    <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="space-y-2">
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Ask for a brief, a plan, a script..."
                  className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  rows={3}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isChatSending}
                  className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-purple-500 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {isChatSending ? "Thinking..." : "Send"}
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Guides</p>
              <div className="space-y-3">
                {GUIDES.map((guide) => (
                  <button
                    key={guide.id}
                    className={`w-full text-left rounded-2xl border px-4 py-3 ${activeGuideId === guide.id ? "border-sky-500/40 bg-sky-500/10" : "border-white/10"}`}
                    onClick={() => setActiveGuideId(guide.id)}
                  >
                    <p className="text-sm font-semibold flex items-center gap-2">
                      {guide.icon}
                      {guide.title}
                    </p>
                    <p className="text-xs text-white/60">{guide.description}</p>
                    {activeGuideId === guide.id && <p className="text-sm text-white/80 mt-2">{guide.content}</p>}
                  </button>
                ))}
              </div>
            </div>

            {notifications.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Telemetry</p>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <NotificationToast key={notification.id} notification={notification} onDismiss={dismissNotification} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

