/**
 * Content Migration Script
 *
 * Extracts hardcoded content from frontend components and migrates to database.
 * Requirements: 7.1-7.9
 */

import { supabaseAdmin } from '../db/supabase'

// ============================================================================
// HARDCODED DATA EXTRACTED FROM FRONTEND COMPONENTS
// ============================================================================

/**
 * Documentation Technologies and Links
 * Extracted from: src/pages/DocsPage.tsx
 */
const DOCUMENTATION_DATA = [
  // Core Languages
  {
    name: 'HTML5',
    icon: 'SiHtml5',
    language: 'HTML',
    category: 'Ngôn ngữ nền tảng',
    links: [
      {
        title: 'F8 - HTML CSS từ Zero đến Hero',
        url: 'https://fullstack.edu.vn/courses/html-css',
        type: 'video' as const,
        description: 'Khóa học tiếng Việt chi tiết',
      },
      {
        title: 'W3Schools - HTML Tutorial',
        url: 'https://www.w3schools.com/html/',
        type: 'docs' as const,
        description: 'Tương tác với "Try it Yourself"',
      },
      {
        title: 'MDN Web Docs - HTML Basics',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Getting_started',
        type: 'docs' as const,
        description: 'Bách khoa toàn thư chuẩn mực',
      },
      {
        title: 'FreeCodeCamp - Responsive Web Design',
        url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
        type: 'docs' as const,
        description: 'Thực hành qua dự án',
      },
      {
        title: 'Traversy Media - HTML Crash Course',
        url: 'https://www.youtube.com/watch?v=UB1O30fR-EE',
        type: 'video' as const,
        description: 'Tóm tắt siêu tốc',
      },
    ],
  },
  {
    name: 'CSS3',
    icon: 'SiCss',
    language: 'CSS',
    category: 'Ngôn ngữ nền tảng',
    links: [
      {
        title: 'F8 - HTML CSS từ Zero đến Hero',
        url: 'https://fullstack.edu.vn/courses/html-css',
        type: 'video' as const,
        description: 'Tiếng Việt dễ hiểu nhất',
      },
      {
        title: 'FreeCodeCamp - Responsive Web Design',
        url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
        type: 'docs' as const,
        description: 'Thực hành tương tác',
      },
      {
        title: 'Flexbox Froggy',
        url: 'https://flexboxfroggy.com/',
        type: 'docs' as const,
        description: 'Học Flexbox qua trò chơi',
      },
      {
        title: 'W3Schools - CSS Tutorial',
        url: 'https://www.w3schools.com/css/',
        type: 'docs' as const,
        description: 'Tra cứu nhanh',
      },
      {
        title: 'MDN Web Docs - CSS First Steps',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps',
        type: 'docs' as const,
        description: 'Chuẩn mực và chuyên sâu',
      },
    ],
  },
  {
    name: 'JavaScript ES6+',
    icon: 'SiJavascript',
    language: 'JavaScript',
    category: 'Ngôn ngữ nền tảng',
    links: [
      {
        title: 'F8 - JavaScript Nâng cao (ES6+)',
        url: 'https://fullstack.edu.vn/courses/javascript-nang-cao',
        type: 'video' as const,
        description: 'Video tiếng Việt bài bản',
      },
      {
        title: 'JavaScript.info',
        url: 'https://javascript.info/',
        type: 'docs' as const,
        description: 'Thánh kinh JS hiện đại',
      },
      {
        title: 'FreeCodeCamp - ES6 Module',
        url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/es6/',
        type: 'docs' as const,
        description: 'Thực hành trực tiếp',
      },
      {
        title: 'Traversy Media - ES6 Crash Course',
        url: 'https://www.youtube.com/watch?v=NCwa_xi0Uuc',
        type: 'video' as const,
        description: 'Tóm tắt siêu tốc',
      },
      {
        title: 'MDN JavaScript',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        type: 'docs' as const,
        description: 'Từ điển chuẩn mực',
      },
    ],
  },
  {
    name: 'TypeScript',
    icon: 'SiTypescript',
    language: 'TypeScript',
    category: 'Ngôn ngữ nền tảng',
    links: [
      {
        title: 'TypeScript Handbook',
        url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
        type: 'docs' as const,
        description: 'Tài liệu chính thức từ Microsoft',
      },
      {
        title: 'Total TypeScript - Beginner Course',
        url: 'https://www.totaltypescript.com/tutorials/beginners-typescript',
        type: 'docs' as const,
        description: 'Khóa học tương tác từ Matt Pocock',
      },
      {
        title: 'React TypeScript Cheatsheets',
        url: 'https://react-typescript-cheatsheet.netlify.app/',
        type: 'docs' as const,
        description: 'Cẩm nang ứng dụng vào React',
      },
      {
        title: 'TypeScript Playground',
        url: 'https://www.typescriptlang.org/play',
        type: 'docs' as const,
        description: 'Thử nghiệm code trực tiếp',
      },
      {
        title: 'FreeCodeCamp - TypeScript Course',
        url: 'https://www.youtube.com/watch?v=BwuLxPH8IDs',
        type: 'video' as const,
        description: 'Video 5 tiếng từ A-Z',
      },
    ],
  },
  {
    name: 'Python',
    icon: 'SiPython',
    language: 'Python',
    category: 'Ngôn ngữ nền tảng',
    links: [
      {
        title: 'Kaggle Python Course',
        url: 'https://www.kaggle.com/learn/python',
        type: 'docs' as const,
        description: 'Khóa học tương tác trực tiếp',
      },
      {
        title: 'How Kteam - Python cơ bản',
        url: 'https://howkteam.vn/course/khoa-hoc-lap-trinh-python-co-ban-32',
        type: 'video' as const,
        description: 'Video tiếng Việt chi tiết',
      },
      {
        title: 'Automate the Boring Stuff',
        url: 'https://automatetheboringstuff.com/',
        type: 'docs' as const,
        description: 'Sách thực chiến miễn phí',
      },
      {
        title: 'Programming with Mosh - Python Tutorial',
        url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
        type: 'video' as const,
        description: 'Tóm tắt 1 giờ',
      },
      {
        title: 'HackerRank - Python Track',
        url: 'https://www.hackerrank.com/domains/python',
        type: 'docs' as const,
        description: 'Luyện tập bài tập',
      },
    ],
  },
  {
    name: 'C++',
    icon: 'SiCplusplus',
    language: 'C++',
    category: 'Ngôn ngữ nền tảng',
    links: [
      {
        title: 'C++ Reference',
        url: 'https://en.cppreference.com/',
        type: 'docs' as const,
        description: 'Tài liệu tham khảo C++',
      },
    ],
  },
  // Frameworks & Libraries
  {
    name: 'React',
    icon: 'SiReact',
    language: 'React',
    category: 'Framework & Thư viện',
    links: [
      {
        title: 'React.dev - Official',
        url: 'https://react.dev/learn/describing-the-ui',
        type: 'docs' as const,
        description: 'Tài liệu chính thức React',
      },
      {
        title: 'FreeCodeCamp - React Full Course',
        url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        type: 'video' as const,
        description: 'Khóa học thực chiến',
      },
      {
        title: 'Easy Frontend - ReactJS Cơ bản',
        url: 'https://www.youtube.com/playlist?list=PLeS7aZkL6govY-rR17BqZ2k1R-k8D6YkX',
        type: 'video' as const,
        description: 'Tiếng Việt dễ hiểu',
      },
      {
        title: 'React Hooks Reference',
        url: 'https://react.dev/reference/react',
        type: 'docs' as const,
        description: 'Tài liệu về Hooks',
      },
      {
        title: 'Web Dev Simplified - React Hooks',
        url: 'https://www.youtube.com/playlist?list=PLZlA0Gpn_vH8EtcCoxgOngOPhQsqIXe6P',
        type: 'video' as const,
        description: 'Bóc tách từng hook',
      },
    ],
  },
  {
    name: 'Next.js',
    icon: 'SiNextdotjs',
    language: 'Next.js',
    category: 'Framework & Thư viện',
    links: [
      {
        title: 'Next.js Official Learn',
        url: 'https://nextjs.org/learn',
        type: 'docs' as const,
        description: 'Khóa học từ Vercel',
      },
      {
        title: 'Next.js Documentation',
        url: 'https://nextjs.org/docs',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
      {
        title: 'Codevolution - Next.js 14 Tutorial',
        url: 'https://www.youtube.com/playlist?list=PLC3y8-r4AaFjO-CRlMmGIAk0NmsPIfL_O',
        type: 'video' as const,
        description: 'Cover App Router',
      },
      {
        title: 'JavaScript Mastery - Next.js Full Course',
        url: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
        type: 'video' as const,
        description: 'Xây dựng dashboard',
      },
    ],
  },
  {
    name: 'Node.js',
    icon: 'SiNodedotjs',
    language: 'Node.js',
    category: 'Framework & Thư viện',
    links: [
      {
        title: 'Node.js Official Docs',
        url: 'https://nodejs.org/docs',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
    ],
  },
  // Build Tools
  {
    name: 'Vite',
    icon: 'SiVite',
    language: 'Vite',
    category: 'Build Tools',
    links: [
      {
        title: 'Vite Official Guide',
        url: 'https://vitejs.dev/guide/',
        type: 'docs' as const,
        description: 'Hướng dẫn setup và config',
      },
      {
        title: 'Web Dev Simplified - Vite Crash Course',
        url: 'https://www.youtube.com/watch?v=KCrXgy8qtjM',
        type: 'video' as const,
        description: 'Lý do chọn Vite',
      },
      {
        title: 'FreeCodeCamp - Vite cho React',
        url: 'https://www.freecodecamp.org/news/how-to-set-up-a-react-project-with-vite/',
        type: 'article' as const,
        description: 'Hướng dẫn step-by-step',
      },
    ],
  },
  {
    name: 'Create React App',
    icon: 'SiReact',
    language: 'React',
    category: 'Build Tools',
    links: [
      {
        title: 'CRA Official Docs',
        url: 'https://create-react-app.dev/docs/getting-started/',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
      {
        title: 'Programming with Mosh - React Tutorial',
        url: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
        type: 'video' as const,
        description: 'Dùng CRA để học React',
      },
      {
        title: 'React Docs - Create React App',
        url: 'https://legacy.reactjs.org/docs/create-a-new-react-app.html',
        type: 'article' as const,
        description: 'Khởi tạo với CRA',
      },
    ],
  },
  // State Management
  {
    name: 'Redux',
    icon: 'SiRedux',
    language: 'Redux',
    category: 'Quản lý trạng thái',
    links: [
      {
        title: 'Redux Toolkit Quick Start',
        url: 'https://redux-toolkit.js.org/tutorials/quick-start',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
      {
        title: 'Codevolution - Redux Toolkit',
        url: 'https://www.youtube.com/playlist?list=PLC3y8-r4AaFiO54XGzL81yUib4F7LhI1Q',
        type: 'video' as const,
        description: 'Hiểu flow Redux hiện đại',
      },
      {
        title: 'F8 - Redux Toolkit',
        url: 'https://www.youtube.com/watch?v=jW01R7R82uA',
        type: 'video' as const,
        description: 'Tiếng Việt',
      },
    ],
  },
  {
    name: 'Context API',
    icon: 'SiReact',
    language: 'React',
    category: 'Quản lý trạng thái',
    links: [
      {
        title: 'React.dev - Context',
        url: 'https://react.dev/learn/passing-data-deeply-with-context',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
      {
        title: 'Web Dev Simplified - React Context',
        url: 'https://www.youtube.com/watch?v=5LrDIWkK_Bc',
        type: 'video' as const,
        description: 'Giải thích ngắn gọn',
      },
      {
        title: 'Kent C. Dodds - Context Best Practice',
        url: 'https://kentcdodds.com/blog/how-to-use-react-context-effectively',
        type: 'article' as const,
        description: 'Best practice từ chuyên gia',
      },
    ],
  },
  {
    name: 'Zustand',
    icon: 'SiReact',
    language: 'React',
    category: 'Quản lý trạng thái',
    links: [
      {
        title: 'Zustand Official Readme',
        url: 'https://github.com/pmndrs/zustand',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
      {
        title: 'Codevolution - Zustand Tutorial',
        url: 'https://www.youtube.com/playlist?list=PLC3y8-r4AaFj-7yvBv1a9M8wQ4VzQO8mH',
        type: 'video' as const,
        description: 'Hướng dẫn chi tiết',
      },
      {
        title: 'TkDodo - Working with Zustand',
        url: 'https://tkdodo.eu/blog/working-with-zustand',
        type: 'article' as const,
        description: 'Cẩm nang từ Core Maintainer',
      },
    ],
  },
  // Routing
  {
    name: 'React Router',
    icon: 'SiReactrouter',
    language: 'React Router',
    category: 'Routing',
    links: [
      {
        title: 'React Router Official Tutorial',
        url: 'https://reactrouter.com/en/main/start/tutorial',
        type: 'docs' as const,
        description: 'Hướng dẫn chính thức',
      },
      {
        title: 'Codevolution - React Router v6',
        url: 'https://www.youtube.com/playlist?list=PLC3y8-r4AaFiY3CSZ8q6E7qU02kE-IOPM',
        type: 'video' as const,
        description: 'Route, Link, Outlet',
      },
      {
        title: 'FreeCodeCamp - React Router 6 Guide',
        url: 'https://www.freecodecamp.org/news/react-router-v6-step-by-step-tutorial/',
        type: 'article' as const,
        description: 'Hướng dẫn chi tiết',
      },
    ],
  },
  // Forms & Validation
  {
    name: 'Formik',
    icon: 'SiFormik',
    language: 'React',
    category: 'Forms & Validation',
    links: [
      {
        title: 'Formik Official Tutorial',
        url: 'https://formik.org/docs/tutorial',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
      {
        title: 'Codevolution - React Formik Tutorial',
        url: 'https://www.youtube.com/playlist?list=PLC3y8-r4AaFjI1XNVA8Z3n9xHhXjGfE_7',
        type: 'video' as const,
        description: 'Tạo form chuyên nghiệp',
      },
      {
        title: 'DigitalOcean - React Forms with Formik',
        url: 'https://www.digitalocean.com/community/tutorials/react-formik',
        type: 'article' as const,
        description: 'Hướng dẫn thực hành',
      },
    ],
  },
  {
    name: 'Yup',
    icon: 'SiReact',
    language: 'JavaScript',
    category: 'Forms & Validation',
    links: [
      {
        title: 'Yup GitHub Repo',
        url: 'https://github.com/jquense/yup',
        type: 'docs' as const,
        description: 'Nguồn gốc validation',
      },
      {
        title: 'Traversy Media - React Form Validation',
        url: 'https://www.youtube.com/watch?v=EYvEEmuE_a0',
        type: 'video' as const,
        description: 'Kết hợp Yup với Formik',
      },
      {
        title: 'LogRocket - Yup Validation Guide',
        url: 'https://blog.logrocket.com/react-form-validation-yup/',
        type: 'article' as const,
        description: 'Hướng dẫn chi tiết',
      },
    ],
  },
  // API & HTTP
  {
    name: 'Axios',
    icon: 'SiAxios',
    language: 'Axios',
    category: 'API & HTTP',
    links: [
      {
        title: 'Axios Official Docs',
        url: 'https://axios-http.com/docs/intro',
        type: 'docs' as const,
        description: 'Config Interceptors',
      },
      {
        title: 'Codevolution - React HTTP (Axios)',
        url: 'https://www.youtube.com/playlist?list=PLC3y8-r4AaFjZWeBpsT-04LwK7XhV9B1b',
        type: 'video' as const,
        description: 'Get, Post, Error, Loading',
      },
    ],
  },
  {
    name: 'Fetch API',
    icon: 'SiJavascript',
    language: 'JavaScript',
    category: 'API & HTTP',
    links: [
      {
        title: 'MDN Fetch API',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
    ],
  },
  // Styling
  {
    name: 'Tailwind CSS',
    icon: 'SiTailwindcss',
    language: 'Tailwind',
    category: 'Styling',
    links: [
      {
        title: 'Tailwind CSS Docs',
        url: 'https://tailwindcss.com/docs/installation',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
      {
        title: 'Tailwind Labs - Building UI',
        url: 'https://www.youtube.com/watch?v=UBOj6rqRUME',
        type: 'video' as const,
        description: 'Xây dựng UI từ đầu',
      },
      {
        title: 'Evondev - Tailwind CSS Tiếng Việt',
        url: 'https://www.youtube.com/playlist?list=PLzZdnTqD_oD-5f16Z4k7sX5z0U3fP_x3i',
        type: 'video' as const,
        description: 'Khóa học tiếng Việt',
      },
    ],
  },
  {
    name: 'CSS Modules',
    icon: 'SiCss',
    language: 'CSS',
    category: 'Styling',
    links: [
      {
        title: 'Next.js - CSS Modules',
        url: 'https://nextjs.org/docs/app/building-your-application/styling/css-modules',
        type: 'docs' as const,
        description: 'Cách hoạt động trong Next.js',
      },
      {
        title: 'Web Dev Simplified - CSS Modules',
        url: 'https://www.youtube.com/watch?v=j5P9FHiBVNo',
        type: 'video' as const,
        description: 'React Styling',
      },
      {
        title: 'CSS-Tricks - CSS Modules',
        url: 'https://css-tricks.com/css-modules-part-1-need/',
        type: 'article' as const,
        description: 'Giới thiệu CSS Modules',
      },
    ],
  },
  {
    name: 'Styled Components',
    icon: 'SiReact',
    language: 'React',
    category: 'Styling',
    links: [
      {
        title: 'Styled Components Official',
        url: 'https://styled-components.com/docs/basics',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
      {
        title: 'Codevolution - Styled Components',
        url: 'https://www.youtube.com/playlist?list=PLC3y8-r4AaFj5exxI1H5oZ2B9s9I9Yv1g',
        type: 'video' as const,
        description: 'Hướng dẫn chi tiết',
      },
      {
        title: 'FreeCodeCamp - Styled Components Guide',
        url: 'https://www.freecodecamp.org/news/styled-components-in-react/',
        type: 'article' as const,
        description: 'Hướng dẫn sử dụng',
      },
    ],
  },
  // Testing
  {
    name: 'Jest',
    icon: 'SiJest',
    language: 'Jest',
    category: 'Testing',
    links: [
      {
        title: 'Jest Official Docs',
        url: 'https://jestjs.io/docs/getting-started',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
      {
        title: 'Codevolution - React Testing (Jest & RTL)',
        url: 'https://www.youtube.com/playlist?list=PLC3y8-r4AaFgVRyZY9hENTEEQXQy51RCA',
        type: 'video' as const,
        description: 'Testing với React',
      },
    ],
  },
  {
    name: 'React Testing Library',
    icon: 'SiReact',
    language: 'React',
    category: 'Testing',
    links: [
      {
        title: 'RTL Official Docs',
        url: 'https://testing-library.com/docs/react-testing-library/intro/',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
      {
        title: 'Web Dev Simplified - React Unit Testing',
        url: 'https://www.youtube.com/watch?v=8Xwq35cPwYg',
        type: 'video' as const,
        description: 'Unit testing React',
      },
    ],
  },
  // Version Control
  {
    name: 'Git',
    icon: 'SiGit',
    language: 'Git',
    category: 'Version Control',
    links: [
      {
        title: 'Git Official Docs',
        url: 'https://git-scm.com/doc',
        type: 'docs' as const,
        description: 'Tài liệu chính thức',
      },
      {
        title: 'Atlassian Git Tutorial',
        url: 'https://www.atlassian.com/git/tutorials',
        type: 'docs' as const,
        description: 'Tutorial từ Atlassian',
      },
      {
        title: 'F8 - Git căn bản',
        url: 'https://www.youtube.com/playlist?list=PL_-VfJajZj0VxwJHU2b0kZ0F_l95nL03S',
        type: 'video' as const,
        description: 'Thực hành Git tiếng Việt',
      },
      {
        title: 'Oh Shit, Git!?!',
        url: 'https://ohshitgit.com/',
        type: 'article' as const,
        description: 'Xử lý lỗi Git',
      },
    ],
  },
]

/**
 * Landing Page Features
 * Extracted from: src/components/landing/FeaturesSection.tsx
 */
const LANDING_FEATURES = [
  {
    icon: 'Code2',
    title: 'Code Editor Tích Hợp',
    description: 'Viết code với syntax highlighting, auto-complete và nhiều tính năng hỗ trợ khác',
    colorGradient: 'from-brand-teal/20 to-brand-cyan/20',
  },
  {
    icon: 'Terminal',
    title: 'Terminal Thực Thi',
    description: 'Chạy code ngay lập tức và xem kết quả trong terminal ảo',
    colorGradient: 'from-brand-cyan/20 to-brand-ocean/20',
  },
  {
    icon: 'BookOpen',
    title: '99+ Bài Học',
    description: 'Từ cơ bản đến nâng cao với lộ trình học rõ ràng cho từng ngôn ngữ',
    colorGradient: 'from-brand-ocean/20 to-brand-teal/20',
  },
  {
    icon: 'Zap',
    title: 'Học Thực Hành',
    description: 'Mỗi bài học đều có bài tập để bạn thực hành ngay',
    colorGradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: 'CheckCircle2',
    title: 'Theo Dõi Tiến Độ',
    description: 'Xem tiến độ học tập và những gì bạn đã hoàn thành',
    colorGradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    icon: 'Sparkles',
    title: 'Hoàn Toàn Miễn Phí',
    description: 'Tất cả tính năng đều miễn phí, không giới hạn',
    colorGradient: 'from-yellow-500/20 to-orange-500/20',
  },
]

/**
 * Landing Page Statistics
 * Extracted from: src/components/landing/StatsSection.tsx
 */
const LANDING_STATS = [
  { icon: 'Users', value: '1,000+', label: 'Học viên' },
  { icon: 'TrendingUp', value: '99+', label: 'Bài học' },
  { icon: 'Award', value: '100%', label: 'Miễn phí' },
]

/**
 * Landing Page Languages
 * Extracted from: src/components/landing/LanguagesSection.tsx
 */
const LANDING_LANGUAGES = [
  {
    name: 'JavaScript',
    lessonCount: 35,
    color: '#f7df1e',
    description: 'Ngôn ngữ web phổ biến nhất',
    icon: 'SiJavascript',
  },
  {
    name: 'Python',
    lessonCount: 40,
    color: '#3776ab',
    description: 'Dễ học, mạnh mẽ cho AI/ML',
    icon: 'SiPython',
  },
  {
    name: 'C++',
    lessonCount: 24,
    color: '#00599c',
    description: 'Hiệu suất cao, lập trình hệ thống',
    icon: 'SiCplusplus',
  },
]

/**
 * Landing Page How It Works Steps
 * Extracted from: src/components/landing/HowItWorksSection.tsx
 */
const LANDING_HOW_IT_WORKS = [
  {
    stepNumber: '01',
    title: 'Chọn ngôn ngữ',
    description: 'Chọn JavaScript, Python hoặc C++ để bắt đầu. Mỗi ngôn ngữ có lộ trình học riêng.',
    icon: 'Code2',
  },
  {
    stepNumber: '02',
    title: 'Học & Thực hành',
    description: 'Đọc bài học, viết code ngay trong editor tích hợp. Mỗi bài có ví dụ và bài tập.',
    icon: 'BookOpen',
  },
  {
    stepNumber: '03',
    title: 'Chạy & Kiểm tra',
    description: 'Chạy code và xem kết quả ngay lập tức. Học từ lỗi và cải thiện kỹ năng.',
    icon: 'Terminal',
  },
]

/**
 * Navigation Items
 * Extracted from: src/components/common/Header.tsx and Footer.tsx
 */
const NAVIGATION_ITEMS = {
  header: [
    { path: '/playground', label: 'Playground' },
    { path: '/select-language', label: 'Học tập' },
    { path: '/docs', label: 'Tài liệu' },
  ],
  footer: [
    { path: '/playground', label: 'Playground' },
    { path: '/select-language', label: 'Học tập' },
    { path: '/docs', label: 'Tài liệu' },
  ],
}

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

interface MigrationReport {
  documentationTechnologies: number
  documentationLinks: number
  landingFeatures: number
  landingStats: number
  landingLanguages: number
  landingHowItWorks: number
  navigationItems: number
  errors: string[]
}

/**
 * Main migration function
 * Requirements: 7.4, 7.5, 7.6, 7.8
 */
async function migrateContent(): Promise<MigrationReport> {
  const report: MigrationReport = {
    documentationTechnologies: 0,
    documentationLinks: 0,
    landingFeatures: 0,
    landingStats: 0,
    landingLanguages: 0,
    landingHowItWorks: 0,
    navigationItems: 0,
    errors: [],
  }

  console.log('🚀 Starting content migration...\n')

  try {
    // Migrate Documentation Technologies and Links
    console.log('📚 Migrating documentation technologies and links...')
    for (let i = 0; i < DOCUMENTATION_DATA.length; i++) {
      const tech = DOCUMENTATION_DATA[i]

      try {
        // Check for duplicates
        const { data: existing } = await supabaseAdmin
          .from('documentation_technologies')
          .select('id')
          .eq('name', tech.name)
          .single()

        if (existing) {
          console.log(`⚠️  Skipping duplicate technology: ${tech.name}`)
          report.errors.push(`Duplicate technology skipped: ${tech.name}`)
          continue
        }

        // Insert technology
        const { data: insertedTech, error: techError } = await supabaseAdmin
          .from('documentation_technologies')
          .insert({
            name: tech.name,
            icon: tech.icon,
            language: tech.language,
            category: tech.category,
            display_order: i,
            status: 'published',
          })
          .select()
          .single()

        if (techError) {
          throw techError
        }

        report.documentationTechnologies++
        console.log(`✅ Migrated technology: ${tech.name}`)

        // Insert links for this technology
        for (let j = 0; j < tech.links.length; j++) {
          const link = tech.links[j]

          const { error: linkError } = await supabaseAdmin.from('documentation_links').insert({
            technology_id: insertedTech.id,
            title: link.title,
            url: link.url,
            type: link.type,
            description: link.description,
            display_order: j,
          })

          if (linkError) {
            throw linkError
          }

          report.documentationLinks++
        }

        console.log(`   ↳ Migrated ${tech.links.length} links`)
      } catch (error: any) {
        const errorMsg = `Failed to migrate technology ${tech.name}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        report.errors.push(errorMsg)
      }
    }

    // Migrate Landing Features
    console.log('\n🎨 Migrating landing features...')
    for (let i = 0; i < LANDING_FEATURES.length; i++) {
      const feature = LANDING_FEATURES[i]

      try {
        const { error } = await supabaseAdmin.from('landing_features').insert({
          icon: feature.icon,
          title: feature.title,
          description: feature.description,
          color_gradient: feature.colorGradient,
          display_order: i,
          status: 'published',
        })

        if (error) throw error

        report.landingFeatures++
        console.log(`✅ Migrated feature: ${feature.title}`)
      } catch (error: any) {
        const errorMsg = `Failed to migrate feature ${feature.title}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        report.errors.push(errorMsg)
      }
    }

    // Migrate Landing Stats
    console.log('\n📊 Migrating landing stats...')
    for (let i = 0; i < LANDING_STATS.length; i++) {
      const stat = LANDING_STATS[i]

      try {
        const { error } = await supabaseAdmin.from('landing_stats').insert({
          icon: stat.icon,
          value: stat.value,
          label: stat.label,
          display_order: i,
          status: 'published',
        })

        if (error) throw error

        report.landingStats++
        console.log(`✅ Migrated stat: ${stat.label}`)
      } catch (error: any) {
        const errorMsg = `Failed to migrate stat ${stat.label}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        report.errors.push(errorMsg)
      }
    }

    // Migrate Landing Languages
    console.log('\n💻 Migrating landing languages...')
    for (let i = 0; i < LANDING_LANGUAGES.length; i++) {
      const lang = LANDING_LANGUAGES[i]

      try {
        const { error } = await supabaseAdmin.from('landing_languages').insert({
          name: lang.name,
          lesson_count: lang.lessonCount,
          color: lang.color,
          description: lang.description,
          icon: lang.icon,
          display_order: i,
          status: 'published',
        })

        if (error) throw error

        report.landingLanguages++
        console.log(`✅ Migrated language: ${lang.name}`)
      } catch (error: any) {
        const errorMsg = `Failed to migrate language ${lang.name}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        report.errors.push(errorMsg)
      }
    }

    // Migrate How It Works Steps
    console.log('\n🔄 Migrating how-it-works steps...')
    for (let i = 0; i < LANDING_HOW_IT_WORKS.length; i++) {
      const step = LANDING_HOW_IT_WORKS[i]

      try {
        const { error } = await supabaseAdmin.from('landing_how_it_works').insert({
          step_number: step.stepNumber,
          title: step.title,
          description: step.description,
          icon: step.icon,
          display_order: i,
          status: 'published',
        })

        if (error) throw error

        report.landingHowItWorks++
        console.log(`✅ Migrated step: ${step.title}`)
      } catch (error: any) {
        const errorMsg = `Failed to migrate step ${step.title}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        report.errors.push(errorMsg)
      }
    }

    // Migrate Navigation Items
    console.log('\n🧭 Migrating navigation items...')

    // Header navigation
    for (let i = 0; i < NAVIGATION_ITEMS.header.length; i++) {
      const item = NAVIGATION_ITEMS.header[i]

      try {
        const { error } = await supabaseAdmin.from('navigation_items').insert({
          location: 'header',
          path: item.path,
          label: item.label,
          display_order: i,
          status: 'published',
        })

        if (error) throw error

        report.navigationItems++
        console.log(`✅ Migrated header nav: ${item.label}`)
      } catch (error: any) {
        const errorMsg = `Failed to migrate header nav ${item.label}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        report.errors.push(errorMsg)
      }
    }

    // Footer navigation
    for (let i = 0; i < NAVIGATION_ITEMS.footer.length; i++) {
      const item = NAVIGATION_ITEMS.footer[i]

      try {
        const { error } = await supabaseAdmin.from('navigation_items').insert({
          location: 'footer',
          path: item.path,
          label: item.label,
          display_order: i,
          status: 'published',
        })

        if (error) throw error

        report.navigationItems++
        console.log(`✅ Migrated footer nav: ${item.label}`)
      } catch (error: any) {
        const errorMsg = `Failed to migrate footer nav ${item.label}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        report.errors.push(errorMsg)
      }
    }
  } catch (error: any) {
    console.error('\n❌ Migration failed with critical error:', error.message)
    report.errors.push(`Critical error: ${error.message}`)
  }

  return report
}

/**
 * Print migration report
 * Requirement 7.8: Generate migration report with counts
 */
function printReport(report: MigrationReport) {
  console.log('\n' + '='.repeat(60))
  console.log('📋 MIGRATION REPORT')
  console.log('='.repeat(60))
  console.log(`✅ Documentation Technologies: ${report.documentationTechnologies}`)
  console.log(`✅ Documentation Links: ${report.documentationLinks}`)
  console.log(`✅ Landing Features: ${report.landingFeatures}`)
  console.log(`✅ Landing Stats: ${report.landingStats}`)
  console.log(`✅ Landing Languages: ${report.landingLanguages}`)
  console.log(`✅ How-It-Works Steps: ${report.landingHowItWorks}`)
  console.log(`✅ Navigation Items: ${report.navigationItems}`)
  console.log('='.repeat(60))

  const totalItems =
    report.documentationTechnologies +
    report.documentationLinks +
    report.landingFeatures +
    report.landingStats +
    report.landingLanguages +
    report.landingHowItWorks +
    report.navigationItems

  console.log(`📦 Total Items Migrated: ${totalItems}`)

  if (report.errors.length > 0) {
    console.log(`\n⚠️  Errors (${report.errors.length}):`)
    report.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`)
    })
  } else {
    console.log('\n🎉 Migration completed successfully with no errors!')
  }

  console.log('='.repeat(60) + '\n')
}

/**
 * Main execution
 */
async function main() {
  try {
    const report = await migrateContent()
    printReport(report)

    if (report.errors.length > 0) {
      process.exit(1)
    }
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run migration
main()
