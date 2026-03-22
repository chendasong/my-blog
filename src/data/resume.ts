import type { Resume } from '@/types/resume'

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
          name: '某某某',
          title: '前端开发工程师',
          workYears: '4',
          email: 'xxxxxx@qq.com',
          phone: 'xxx-xxxx-xxxx',
          location: '江西',
          status: '离职',
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
              school: '某某大学',
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
            { id: 'skill-1', skill: '熟悉计算机组成原理，计算机网络以及操作系统的一系列知识' },
            { id: 'skill-2', skill: '熟悉常见的数据结构和算法，能够使用算法解决常见问题' },
            { id: 'skill-3', skill: '熟悉 HTML、CSS，理解并掌握盒子模型，响应式布局，移动端兼容问题' },
            { id: 'skill-4', skill: '熟练使用 JavaScript，理解原型、闭包、异步等概念' },
            { id: 'skill-5', skill: '熟练使用 ES6+ 语法，熟悉常用设计模式' },
            { id: 'skill-6', skill: '熟悉函数式编程，熟悉 TypeScript' },
            { id: 'skill-7', skill: '熟练使用 Vue 和 React 进行项目开发' },
            { id: 'skill-8', skill: '了解 webpack 打包配置，减小打包后的体积，提高响应速度' },
            { id: 'skill-9', skill: '熟悉 nodejs + mongodb 搭建后台系统，能够高效和后端进行联调' },
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
        id: 'section-certifications',
        type: 'certifications',
        title: '证书',
        visible: true,
        order: 6,
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
      {
        id: 'section-introduction',
        type: 'introduction',
        title: '个人介绍',
        visible: true,
        order: 7,
        content: {
          text: '这是一个关于我的个人简介。我热爱编程和开源，专注于前端和全栈开发。在过去的几年里，我积累了丰富的项目经验，参与过多个大型项目的开发和维护。我相信持续学习和技术创新是成功的关键。',
        },
      },
    ],
  }
}
