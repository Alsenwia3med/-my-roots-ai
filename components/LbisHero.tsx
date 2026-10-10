import React from 'react';

export default function LbisHero() {
  return (
    <svg viewBox="-280 -260 560 460" xmlns="http://www.w3.org/2000/svg">
      <g>
        {/* Gold trunk */}
        <path
          d="M -5 155 C -10 80 -4 30 0 -20 C 5 -80 55 -115 95 -165"
          fill="none"
          stroke="#22C7DB"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.75"
        />
        {/* Teal branches */}
        <path
          d="M -2 110 C -75 70 -130 20 -185 -70 M 0 80 C 70 45 135 10 185 -75 M 0 45 C -50 -15 -55 -85 -70 -175 M 5 35 C 65 -20 80 -95 90 -165 M 0 115 C -65 125 -95 145 -120 165 M 5 120 C 70 125 105 145 120 160"
          fill="none"
          stroke="#0E9093"
          strokeWidth="3"
          opacity="0.8"
        />

        {/* Center Biological State */}
        <circle cx="0" cy="0" r="86" fill="#055564" stroke="#22C7DB" strokeWidth="2" />
        <text x="0" y="-12" fill="#FFFFFF" fontSize="14" fontWeight="600" textAnchor="middle" opacity="1">
          BIOLOGICAL
        </text>
        <text x="0" y="12" fill="#FFFFFF" fontSize="24" fontWeight="700" textAnchor="middle" opacity="1">
          STATE
        </text>
        <text x="0" y="37" fill="#22C7DB" fontSize="11" fontWeight="600" textAnchor="middle" opacity="1">
          61 / 100 · STRAINED
        </text>

        {/* Connector lines */}
        <line x1="0" y1="0" x2="-190" y2="-110" stroke="#D8DEE8" strokeWidth="1" opacity="0.55" />
        <line x1="0" y1="0" x2="-70" y2="-180" stroke="#D8DEE8" strokeWidth="1" opacity="0.55" />
        <line x1="0" y1="0" x2="90" y2="-170" stroke="#D8DEE8" strokeWidth="1" opacity="0.55" />
        <line x1="0" y1="0" x2="195" y2="-75" stroke="#D8DEE8" strokeWidth="1" opacity="0.55" />
        <line x1="0" y1="0" x2="185" y2="80" stroke="#D8DEE8" strokeWidth="1" opacity="0.55" />
        <line x1="0" y1="0" x2="70" y2="170" stroke="#D8DEE8" strokeWidth="1" opacity="0.55" />
        <line x1="0" y1="0" x2="-105" y2="160" stroke="#D8DEE8" strokeWidth="1" opacity="0.55" />

        {/* Domain: Metabolic */}
        <circle cx="-190" cy="-110" r="31" fill="#FFFFFF" stroke="#0E9093" strokeWidth="3" />
        <text x="-190" y="-105" fill="#0E9093" fontSize="11" fontWeight="700" textAnchor="middle" opacity="1">ME</text>
        <text x="-190" y="-62" fill="#075464" fontSize="10" fontWeight="600" textAnchor="middle" opacity="1">Metabolic</text>

        {/* Domain: Hunger */}
        <circle cx="-70" cy="-180" r="31" fill="#FFFFFF" stroke="#22C7DB" strokeWidth="3" />
        <text x="-70" y="-175" fill="#22C7DB" fontSize="11" fontWeight="700" textAnchor="middle" opacity="1">HU</text>
        <text x="-70" y="-132" fill="#075464" fontSize="10" fontWeight="600" textAnchor="middle" opacity="1">Hunger</text>

        {/* Domain: Sleep */}
        <circle cx="90" cy="-170" r="31" fill="#FFFFFF" stroke="#075464" strokeWidth="3" />
        <text x="90" y="-165" fill="#075464" fontSize="11" fontWeight="700" textAnchor="middle" opacity="1">SL</text>
        <text x="90" y="-122" fill="#075464" fontSize="10" fontWeight="600" textAnchor="middle" opacity="1">Sleep</text>

        {/* Domain: Circadian */}
        <circle cx="195" cy="-75" r="31" fill="#FFFFFF" stroke="#0E9093" strokeWidth="3" />
        <text x="195" y="-70" fill="#0E9093" fontSize="11" fontWeight="700" textAnchor="middle" opacity="1">CI</text>
        <text x="195" y="-27" fill="#075464" fontSize="10" fontWeight="600" textAnchor="middle" opacity="1">Circadian</text>

        {/* Domain: Stress */}
        <circle cx="185" cy="80" r="31" fill="#FFFFFF" stroke="#E67E22" strokeWidth="3" />
        <text x="185" y="85" fill="#E67E22" fontSize="11" fontWeight="700" textAnchor="middle" opacity="1">ST</text>
        <text x="185" y="128" fill="#075464" fontSize="10" fontWeight="600" textAnchor="middle" opacity="1">Stress</text>

        {/* Domain: Inflammation */}
        <circle cx="70" cy="170" r="31" fill="#FFFFFF" stroke="#22C7DB" strokeWidth="3" />
        <text x="70" y="175" fill="#22C7DB" fontSize="11" fontWeight="700" textAnchor="middle" opacity="1">IN</text>
        <text x="70" y="218" fill="#075464" fontSize="10" fontWeight="600" textAnchor="middle" opacity="1">Inflammation</text>

        {/* Domain: Safety */}
        <circle cx="-105" cy="160" r="31" fill="#FFFFFF" stroke="#27AE60" strokeWidth="3" />
        <text x="-105" y="165" fill="#27AE60" fontSize="11" fontWeight="700" textAnchor="middle" opacity="1">SA</text>
        <text x="-105" y="208" fill="#075464" fontSize="10" fontWeight="600" textAnchor="middle" opacity="1">Safety</text>
      </g>
    </svg>
  );
}
