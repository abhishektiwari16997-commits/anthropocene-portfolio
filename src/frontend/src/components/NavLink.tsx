import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

interface NavLinkProps {
  to: string;
  title: string;
  index: number;
  description: string;
}

export function NavLink({ to, title, index, description }: NavLinkProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      data-ocid={`nav.link.${index + 1}`}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay: 0.8 + index * 0.15,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ x: shouldReduceMotion ? 0 : 6 }}
      style={{ cursor: "pointer" }}
    >
      <Link
        to={to}
        style={{ textDecoration: "none", display: "block" }}
        className="group"
      >
        <div
          style={{
            paddingTop: "1.5rem",
            paddingBottom: "1.5rem",
            paddingRight: "2rem",
            borderBottom: "1px solid rgba(229, 224, 216, 0.10)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Laterite hover border bottom */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "#8C3A3A",
              transformOrigin: "left",
            }}
          />

          {/* Title row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <motion.span
              initial={{ color: "rgba(229, 224, 216, 0.80)" }}
              whileHover={{ color: "rgba(229, 224, 216, 1)" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif"
              style={{
                fontSize: "clamp(16px, 2.2vw, 26px)",
                fontWeight: 400,
                lineHeight: 1.2,
              }}
            >
              {title}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -8 }}
              whileHover={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ color: "#E5E0D8", flexShrink: 0 }}
            >
              <ArrowUpRight size={16} />
            </motion.span>
          </div>

          {/* Description */}
          <p
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "11px",
              color: "rgba(229, 224, 216, 0.40)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              maxWidth: "220px",
              margin: 0,
            }}
          >
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
