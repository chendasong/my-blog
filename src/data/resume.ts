import type { Resume, ResumeSection } from '@/types/resume'

export function generateDefaultResume(): Resume {
  return {
    id: 'resume-1',
    userId: 'user-1',
    theme: 'light',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'section-basic',
        type: 'basic',
        title: '基本信息',
        visible: true,
        order: 0,
        content: {
          name: '晨光',
          title: '全栈开发工程师',
          email: 'hello@example.com',
          phone: '+86 138-0000-0000',
          location: '深圳',
          bio: '热爱编程和开源，专注于前端和全栈开发。',
          avatar: '',
        },
      },
      {
        id: 'section-education',
        type: 'education',
        title: '教育背景',
        visible: true,
        order: 1,
        content: {
          items: [
            {
              id: 'edu-1',
              school: '某大学',
              degree: '本科',
              field: '计算机科学与技术',
              startDate: '2018-09-01',
              endDate: '2022-06-30',
              description: 'GPA: 3.8/4.0，获得优秀毕业生称号',
            },
          ],
        },
      },
      {
        id: 'section-experience',
        type: 'experience',
        title: '工作经历',
        visible: true,
        order: 2,
        content: {
          items: [
            {
              id: 'exp-1',
              company: '某科技公司',
              position: '高级前端工程师',
              startDate: '2022-07-01',
              endDate: '',
              description: '负责公司核心产品的前端开发和维护',
              highlights: [
                '使用 Vue 3 + TypeScript 开发高性能应用',
                '优化页面加载速度，提升 50% 的性能',
                '带领团队完成多个重要项目',
              ],
            },
          ],
        },
      },
      {
        id: 'section-skills',
        type: 'skills',
        title: '技能',
        visible: true,
        order: 3,
        content: {
          items: [
            {
              id: 'skill-1',
              category: '前端开发',
              skills: ['Vue 3', 'React', 'TypeScript', 'Tailwind CSS'],
            },
            {
              id: 'skill-2',
              category: '后端开发',
              skills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL'],
            },
            {
              id: 'skill-3',
              category: '工具和平台',
              skills: ['Git', 'Docker', 'AWS', 'CI/CD'],
            },
          ],
        },
      },
      {
        id: 'section-projects',
        type: 'projects',
        title: '项目',
        visible: true,
        order: 4,
        content: {
          items: [
            {
              id: 'proj-1',
              name: '个人博客系统',
              description: '一个功能完整的博客平台，支持文章发布、评论、标签等功能',
              technologies: ['Vue 3', 'TypeScript', 'Supabase', 'Tailwind CSS'],
              link: 'https://example.com',
              startDate: '2023-01-01',
              endDate: '2023-06-30',
            },
          ],
        },
      },
      {
        id: 'section-awards',
        type: 'awards',
        title: '奖项',
        visible: true,
        order: 5,
        content: {
          items: [
            {
              id: 'award-1',
              title: '最佳员工',
              issuer: '某科技公司',
              date: '2023-12-01',
              description: '因在项目中的杰出表现获得',
            },
          ],
        },
      },
      {
        id: 'section-languages',
        type: 'languages',
        title: '语言',
        visible: true,
        order: 6,
        content: {
          items: [
            {
              id: 'lang-1',
              language: '中文',
              proficiency: 'fluent',
            },
            {
              id: 'lang-2',
              language: '英文',
              proficiency: 'advanced',
            },
          ],
        },
      },
      {
        id: 'section-certifications',
        type: 'certifications',
        title: '证书',
        visible: true,
        order: 7,
        content: {
          items: [
            {
              id: 'cert-1',
              name: 'AWS Certified Solutions Architect',
              issuer: 'Amazon Web Services',
              date: '2023-06-01',
              credentialId: 'ABC123',
              credentialUrl: 'https://example.com',
            },
          ],
        },
      },
    ],
  }
}
