import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ArtPortfolioItem } from "../backend.d";
import { AnthropoceneAnchor } from "../components/AnthropoceneAnchor";
import { useCursor } from "../context/CursorContext";
import { getBackend } from "../utils/getBackend";

// ─── Assets ──────────────────────────────────────────────────────────────────
const galleryAudio = "/assets/oceanframemusic-romantic-video-483626.mp3";

// ─── Artist Statement Text ────────────────────────────────────────────────────

const PARAGRAPH_1 =
  "When asked where I belong, I have no simple answer. I was born in Uttar Pradesh, have deep ties to Chandigarh, and now live in Mukkam, Kerala, where I am often viewed as a \u201cNorth Indian\u201d outsider. My practice is rooted in this persistent state of in-betweenness\u2014the everyday ache of missing home while migrating to build independence. This personal sense of displacement mirrors the physical destruction happening in my immediate surroundings, where the natural landscape is being violently reshaped by illegal stone quarries. Deeply inspired by Andreas Huyssen\u2019s writings in Present Pasts on how we construct memory and space, my work exists at the intersection of human migration and the ecological shifting of the earth. I navigate these themes by taking on the persona of the \u201cAnthropocene,\u201d conducting body-based performances and hosting open discussions with local residents and migrant workers. My practice is highly participatory; the memories, phrases, and thoughts shared by the community become the very foundation of my art.";

const PARAGRAPH_2 =
  "Through an interdisciplinary approach of oil painting, printmaking, and performance, I translate these fragile conversations into tangible forms, as seen in the works submitted for this application. One piece juxtaposes my childhood memories of playing stapu on quiet, community-owned roads with today\u2019s hyper-capitalist reality in the Malappuram hills, where remote forest roads are engineered solely for heavy quarry trucks. Another work grounds this ecological violence in intimate human experience, highlighting a migrant quarry worker who spends his solitary Sundays buying weekly groceries, deeply missing his young daughter, Pari, back home. The submitted oil paintings, executed in an impressionistic style to capture the fleeting nature of memory, carry titles that are direct quotes from the people I speak with. Phrases like \u201cAre we drilling into the mountain, or just ourselves?\u201d, \u201cMaking a house by breaking a home,\u201d \u201cThere is no shoulder where I can rest my head,\u201d and \u201cMy village is still here,\u201d reflect the shared heartbreak of my surroundings. Together, these works question our shifting societal priorities and what it means to belong to a place that is constantly being erased.";

// ─── WordSplit: word-by-word hover spans ──────────────────────────────────────

function WordSplit({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          style={{
            display: "inline-block",
            marginRight: "0.28em",
            position: "relative",
            cursor: "default",
            lineHeight: 1.85,
          }}
          whileHover={{ scale: 1.05, zIndex: 10 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 28,
            duration: 0.4,
          }}
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}

// ─── Artist Statement Section ─────────────────────────────────────────────────

function ArtistStatement() {
  return (
    <section
      data-ocid="art.statement.section"
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        overflow: "hidden",
        padding: "7rem 0 5rem",
      }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          top: "5rem",
          left: "clamp(2rem, 8vw, 8rem)",
          right: "clamp(2rem, 8vw, 8rem)",
          height: "1px",
          background: "rgba(140,58,58,0.3)",
          transformOrigin: "left",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: "rgba(20,20,20,0.95)",
          border: "1px solid rgba(140,58,58,0.2)",
          padding: "clamp(2.5rem, 5vw, 5rem)",
          maxWidth: "860px",
          width: "90vw",
          boxShadow: "0 0 80px rgba(140,58,58,0.06)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(11px, 1vw, 13px)",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(140,58,58,0.8)",
            margin: "0 0 1.2rem 0",
            fontWeight: 400,
          }}
        >
          Artist Statement
        </h2>

        <div
          style={{
            width: "100%",
            height: "1px",
            background: "rgba(140,58,58,0.25)",
            marginBottom: "2rem",
          }}
        />

        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(13px, 1.15vw, 16px)",
            color: "rgba(229,224,216,0.82)",
            lineHeight: 1.85,
            margin: "0 0 1.6rem 0",
            letterSpacing: "0.01em",
          }}
        >
          <WordSplit text={PARAGRAPH_1} />
        </p>

        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(13px, 1.15vw, 16px)",
            color: "rgba(229,224,216,0.82)",
            lineHeight: 1.85,
            margin: 0,
            letterSpacing: "0.01em",
          }}
        >
          <WordSplit text={PARAGRAPH_2} />
        </p>
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          bottom: "5rem",
          left: "clamp(2rem, 8vw, 8rem)",
          right: "clamp(2rem, 8vw, 8rem)",
          height: "1px",
          background: "rgba(140,58,58,
