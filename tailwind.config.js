/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1B6B4E',
          dark:    '#0E1C16',
          mint:    '#A3DEC4',
          surface: '#E3F5EC',
        },
        surface: {
          bg:     '#EDF2EE',
          card:   '#FFFFFF',
          subtle: '#F5FAF7',
          border: '#E7EFE9',
        },
        accent: {
          blue:        '#1558D6',
          'blue-soft': '#EBF0FD',
          green:       '#1B6B4E',
          'green-soft':'#E3F5EC',
          purple:      '#6B3AC8',
          'purple-soft':'#F0E9FC',
          orange:      '#C85A12',
          'orange-soft':'#FEF2E8',
        },
        ink: '#0D1F17',
      },
      borderRadius: {
        card: '1rem',
      },
      boxShadow: {
        card:       '0 1px 4px rgba(13,31,23,.06)',
        'card-hover':'0 4px 16px rgba(13,31,23,.10)',
      },
    },
  },
  plugins: [],
}
