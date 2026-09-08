const L=(en,zh)=>({en,zh});
window.STUDIO_DATA = {
  students:[
    {id:'leo',name:'Leo',age:14,level:L('Level 2 · AI Product Builder','Level 2 · AI 产品构建者'),project:L('AI Face Recognition Access System','AI 人脸识别门禁系统'),progress:72,status:L('Active','学习中'),skills:{'AI Concepts':8,'Programming Logic':7,'Debugging':8,'System Design':6,'Independent Thinking':8,'Communication':6},lessons:[
      {n:4,title:L('Computer Vision Foundations','计算机视觉基础'),date:'Aug 12',achievement:L('Built a working face-recognition pipeline.','完成了可运行的人脸识别流程。'),difficulty:L('Understanding model vs application logic.','理解模型与应用逻辑的区别。')},
      {n:5,title:L('Local User Database','本地用户数据库'),date:'Aug 19',achievement:L('Connected identity results to a local user database.','将身份识别结果连接到本地用户数据库。'),difficulty:L('Designing a clean schema.','设计清晰的数据结构。')},
      {n:6,title:L('Access Control System','门禁权限系统'),date:'Aug 26',achievement:L('Separated identity recognition from permission checks.','将身份识别与权限检查拆分为独立模块。'),difficulty:L('System abstraction.','系统抽象能力。')}
    ]},
    {id:'kevin',name:'Kevin',age:13,level:L('Level 1 · AI Creator','Level 1 · AI 创造者'),project:L('Gesture-Controlled Minecraft','手势控制 Minecraft'),progress:64,status:L('Active','学习中'),skills:{'AI Concepts':6,'Programming Logic':7,'Debugging':8,'System Design':4,'Independent Thinking':8,'Communication':6},lessons:[
      {n:6,title:L('Gesture Control','手势控制'),date:'Aug 15',achievement:L('Connected webcam gestures to game actions.','将摄像头手势与游戏动作成功连接。'),difficulty:L('Repeated triggering.','连续重复触发。')},
      {n:7,title:L('State & Events','状态与事件'),date:'Aug 22',achievement:L('Learned to reason about state changes.','开始理解并分析状态变化。'),difficulty:L('Separating input from action.','区分输入与动作。')},
      {n:8,title:L('Cooldown Debugging','Cooldown 调试'),date:'Aug 29',achievement:L('Independently proposed a cooldown mechanism to stop repeated triggering.','独立提出用 cooldown 机制解决连续触发问题。'),difficulty:L('Event timing.','事件时序。')}
    ]},
    {id:'amy',name:'Amy',age:12,level:L('Level 1 · AI Creator','Level 1 · AI 创造者'),project:L('AI Pet Classifier','AI 宠物分类器'),progress:58,status:L('Active','学习中'),skills:{'AI Concepts':7,'Programming Logic':5,'Debugging':6,'System Design':3,'Independent Thinking':7,'Communication':7},lessons:[
      {n:5,title:L('Train a Classifier','训练分类器'),date:'Aug 17',achievement:L('Collected her own dataset and trained a first model.','自己采集数据集并训练了第一个模型。'),difficulty:L('Overfitting.','过拟合。')},
      {n:6,title:L('Dataset Bias','数据集偏差'),date:'Aug 24',achievement:L('Discovered that identical backgrounds were biasing the model.','发现相同背景正在让模型产生偏差。'),difficulty:L('Data quality.','数据质量。')},
      {n:7,title:L('Rebuild the Dataset','重建数据集'),date:'Aug 31',achievement:L('Proposed varying backgrounds and recaptured training images.','主动提出更换背景并重新采集训练图片。'),difficulty:L('Experiment design.','实验设计。')}
    ]}
  ],
  skillLabels:{'AI Concepts':L('AI Concepts','AI 概念'),'Programming Logic':L('Programming Logic','编程逻辑'),'Debugging':L('Debugging','调试能力'),'System Design':L('System Design','系统设计'),'Independent Thinking':L('Independent Thinking','独立思考'),'Communication':L('Communication','表达沟通')},
  content:[
    {id:126,title:L('AI coding should not be only about teaching kids prompts','AI编程不能只是教孩子Prompt'),pillar:L('Teaching Philosophy','教学理念'),status:'Published',views:18432,saves:314,leads:12,source:L('Course reflection','课程反思')},
    {id:127,title:L('The first time a 14-year-old understood “system design”','14岁孩子第一次理解“系统设计”'),pillar:L('Student Growth','学生成长'),status:'Ready',views:null,saves:null,leads:null,source:L('Leo · Lesson 06','Leo · 第06课')},
    {id:128,title:L('One cooldown helped a student truly understand State','一个 cooldown，让孩子真正理解 State'),pillar:L('Student Growth','学生成长'),status:'Draft',views:null,saves:null,leads:null,source:L('Kevin · Lesson 08','Kevin · 第08课')},
    {id:129,title:L('Why more AI data does not always mean better data','为什么 AI 数据多，不代表数据好？'),pillar:L('AI Concepts','AI 概念'),status:'Idea',views:null,saves:null,leads:null,source:L('Amy · Lesson 06','Amy · 第06课')}
  ],
  brain:[
    {type:L('Teaching Principle','教学原则'),title:L('Build first, explain when needed.','先做出来，需要时再解释。'),body:L('Do not front-load theory. Let the project create the need for the concept, then teach the minimum necessary knowledge at the moment it becomes useful.','不要把理论一次性灌给学生。先让项目产生真实需求，再在概念真正有用的时刻讲“最少必要知识”。'),evidence:[L('Minecraft deployment','Minecraft 部署'),L('Gesture cooldown','手势 cooldown'),L('Face access system','人脸门禁系统')]},
    {type:L('Teaching Principle','教学原则'),title:L('Debugging is a learning outcome, not a failure state.','Debugging 本身就是学习成果，而不是失败。'),body:L('A bug is often the best teaching surface because it forces students to form hypotheses, test them and revise their mental model.','Bug 往往是最好的教学现场，因为它迫使学生提出假设、验证假设并修正自己的理解模型。'),evidence:[L('Kevin Lesson 08','Kevin 第08课'),L('Student project reflections','学生项目复盘')]},
    {type:L('Teaching Principle','教学原则'),title:L('AI should reduce implementation friction, not remove thinking.','AI 应该降低实现阻力，而不是替代思考。'),body:L('Students can collaborate with AI to write code, but they still need to define the problem, make architecture decisions, test results and explain why the system works.','学生可以和 AI 协作写代码，但仍然需要定义问题、做架构决策、验证结果，并解释系统为什么能工作。'),evidence:[L('Level 1 curriculum','Level 1 课程'),L('Level 2 curriculum','Level 2 课程')]},
    {type:L('Content Insight','内容洞察'),title:L('Specific student stories are stronger than generic course claims.','具体的学生成长故事，比泛泛的课程宣传更有力量。'),body:L('Concrete moments of struggle → discovery → improvement give parents visible evidence of growth and create stronger content than abstract marketing language.','“遇到困难 → 发现问题 → 完成突破”的真实瞬间，能让家长看见成长，也比抽象营销语言更有内容价值。'),evidence:[L('Student growth posts','学生成长类内容')]},
    {type:L('Business Insight','业务洞察'),title:L('Parents need visible growth translated into non-technical language.','家长需要的是看得见的成长，而不是技术术语。'),body:L('Parent updates should explain what changed in the child’s thinking, not merely list technologies such as Flask, APIs or computer vision.','家长反馈应该解释孩子的思维发生了什么变化，而不是只罗列 Flask、API、计算机视觉等技术名词。'),evidence:[L('Parent-report workflow','家长反馈工作流')]}
  ],
  inbox:[
    {type:L('Lesson Observation','课堂观察'),title:L('Kevin independently proposed cooldown','Kevin 独立提出 cooldown 方案'),meta:L('Kevin · Lesson 08','Kevin · 第08课'),status:'Processed'},
    {type:L('Content Idea','内容灵感'),title:L('What should kids still learn after AI can write code?','AI写代码以后，孩子到底还应该学什么？'),meta:L('Teaching philosophy','教学理念'),status:'Ready'},
    {type:L('Decision','决策'),title:L('Introduce APIs through project need, not REST theory','从项目需求引入 API，而不是先讲 REST 理论'),meta:L('Curriculum · Level 2','课程体系 · Level 2'),status:'Proposed'}
  ]
};
