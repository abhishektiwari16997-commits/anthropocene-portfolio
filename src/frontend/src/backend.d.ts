import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DesignPortfolioItem {
    id: bigint;
    figmaUrl: string;
    client: string;
    title: string;
    pdfData: string;
    imageData: string;
    tags: Array<string>;
    year: string;
    description: string;
    isLive: boolean;
    videoUrl: string;
}
export interface ResearchItem {
    id: bigint;
    title: string;
    imagePath: string;
    description: string;
    isLive: boolean;
}
export interface StudentWorkItem {
    id: bigint;
    photoData: string;
    pdfData: string;
    studentName: string;
    description: string;
    isLive: boolean;
}
export interface LectureItem {
    id: bigint;
    title: string;
    duration: string;
    pdfData: string;
    description: string;
    isLive: boolean;
    prototypeUrl: string;
}
export interface ArtPortfolioItem {
    id: bigint;
    title: string;
    imagePath: string;
    isLive: boolean;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addArtItem(title: string, imagePath: string): Promise<bigint>;
    addDesignPortfolio(title: string, client: string, year: string, tags: Array<string>, figmaUrl: string, imageData: string, videoUrl: string, description: string, pdfData: string): Promise<bigint>;
    addLecture(title: string, prototypeUrl: string, description: string, duration: string, pdfData: string): Promise<bigint>;
    addResearchItem(title: string, description: string, imagePath: string): Promise<bigint>;
    addStudentWork(studentName: string, description: string, photoData: string, pdfData: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteArtItem(id: bigint): Promise<boolean>;
    deleteDesignPortfolio(id: bigint): Promise<boolean>;
    deleteLecture(id: bigint): Promise<boolean>;
    deleteResearchItem(id: bigint): Promise<boolean>;
    deleteStudentWork(id: bigint): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCvLink(): Promise<string>;
    getCvPdf(): Promise<string>;
    getProfessionalNarrative(): Promise<string>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    healthCheck(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    listAllArtItems(): Promise<Array<ArtPortfolioItem>>;
    listAllDesignPortfolio(): Promise<Array<DesignPortfolioItem>>;
    listAllLectures(): Promise<Array<LectureItem>>;
    listAllResearchItems(): Promise<Array<ResearchItem>>;
    listAllStudentWorks(): Promise<Array<StudentWorkItem>>;
    listLiveArtItems(): Promise<Array<ArtPortfolioItem>>;
    listLiveDesignPortfolio(): Promise<Array<DesignPortfolioItem>>;
    listLiveLectures(): Promise<Array<LectureItem>>;
    listLiveResearchItems(): Promise<Array<ResearchItem>>;
    listLiveStudentWorks(): Promise<Array<StudentWorkItem>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setArtItemLive(id: bigint, isLive: boolean): Promise<boolean>;
    setCvLink(link: string): Promise<void>;
    setCvPdf(data: string): Promise<void>;
    setDesignPortfolioLive(id: bigint, isLive: boolean): Promise<boolean>;
    setLectureLive(id: bigint, isLive: boolean): Promise<boolean>;
    setProfessionalNarrative(narrative: string): Promise<void>;
    setResearchItemLive(id: bigint, isLive: boolean): Promise<boolean>;
    setStudentWorkLive(id: bigint, isLive: boolean): Promise<boolean>;
}
