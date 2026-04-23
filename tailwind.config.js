/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        peach: '#FFD6BA',
        mint: '#C8F4DE',
        lavender: '#E4D4F4',
        butter: '#FFF3B0',
        cream: '#FAF6EF',
        coral: '#E85A5A',
        tangerine: '#F39445',
        leaf: '#3FB85A',
        ink: '#1F1A2B',
        mauve: '#60527A',
        bone: '#EFE8DD',
      },
      fontSize: {
        'xs': ['0.72rem', { lineHeight: '1.1rem' }],
        'sm': ['0.82rem', { lineHeight: '1.2rem' }],
        'base': ['0.92rem', { lineHeight: '1.4rem' }],
        'lg': ['1.02rem', { lineHeight: '1.55rem' }],
        'xl': ['1.18rem', { lineHeight: '1.7rem' }],
        '2xl': ['1.42rem', { lineHeight: '1.9rem' }],
        '3xl': ['1.7rem', { lineHeight: '2.1rem' }],
        '4xl': ['2.1rem', { lineHeight: '2.4rem' }],
        '5xl': ['2.7rem', { lineHeight: '1.05' }],
        '6xl': ['3.3rem', { lineHeight: '1.02' }],
        '7xl': ['4rem', { lineHeight: '1' }],
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter: '-0.02em',
      },
      transitionTimingFunction: {
        'soft-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      fontFamily: {
        fraunces: ['Fraunces', '"DM Serif Display"', 'serif'],
        serifdisplay: ['"DM Serif Display"', 'Fraunces', 'serif'],
        inter: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        caveat: ['Caveat', 'cursive'],
      },
      borderRadius: {
        xl2: '1.25rem',
        blob: '2rem 3rem 2.5rem 3rem / 3rem 2rem 3rem 2rem',
        squishy: '42% 58% 65% 35% / 45% 45% 55% 55%',
      },
      boxShadow: {
        soft: '0 4px 24px -10px rgba(31,26,43,0.12)',
        pop: '0 10px 28px -14px rgba(232,90,90,0.35)',
        glow: '0 0 32px rgba(228,212,244,0.6)',
        ring: '0 0 0 6px rgba(255,214,186,0.35)',
        line: '0 1px 0 rgba(31,26,43,0.06)',
      },
      backgroundImage: {
        'pastel-gradient': 'linear-gradient(135deg, #FFD6BA 0%, #E4D4F4 50%, #C8F4DE 100%)',
        'coral-gradient': 'linear-gradient(135deg, #E85A5A 0%, #F39445 100%)',
        'butter-gradient': 'linear-gradient(135deg, #FFF3B0 0%, #FFD6BA 100%)',
        'grain': 'radial-gradient(rgba(31,26,43,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grain': '3px 3px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '50%': { transform: 'translate(6px,-4px)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shine: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientPan: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        caret: {
          '0%,100%': { opacity: '0' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        float: 'float 7s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        drift: 'drift 8s ease-in-out infinite',
        bounceSoft: 'bounceSoft 2.4s ease-in-out infinite',
        fadeInUp: 'fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        shine: 'shine 5s linear infinite',
        gradientPan: 'gradientPan 12s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite',
        caret: 'caret 1s steps(2) infinite',
      },
    },
  },
  plugins: [],
};
