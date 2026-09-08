-- Seed content based on Chongyu Studio's existing curriculum/project patterns.
insert into students (slug,name,age,current_level,current_project,progress) values
('leo','Leo',14,'Level 2 · AI Product Builder','AI Face Recognition Access System',72),
('kevin','Kevin',13,'Level 1 · AI Creator','Gesture-Controlled Minecraft',64),
('amy','Amy',12,'Level 1 · AI Creator','AI Pet Classifier',58)
on conflict (slug) do nothing;

insert into lessons(student_id,lesson_number,lesson_date,title,achievement,difficulty,next_step)
select id,6,'2026-08-26','Access Control System','Separated identity recognition from permission checks.','System abstraction.','Introduce APIs through practical system integration.' from students where slug='leo';
insert into lessons(student_id,lesson_number,lesson_date,title,achievement,difficulty,next_step)
select id,8,'2026-08-29','Cooldown Debugging','Independently proposed a cooldown mechanism to stop repeated gesture triggering.','Event timing.','Introduce event-driven programming and state transitions.' from students where slug='kevin';
insert into lessons(student_id,lesson_number,lesson_date,title,achievement,difficulty,next_step)
select id,6,'2026-08-24','Dataset Bias','Discovered that identical training backgrounds were biasing the classifier.','Data quality.','Rebuild dataset with varied backgrounds and compare performance.' from students where slug='amy';

insert into company_brain(brain_type,title,body,evidence,created_by,approved_by) values
('teaching_principle','Build first, explain when needed.','Let the project create the need for the concept, then teach the minimum necessary knowledge at the moment it becomes useful.','["project-based learning","minimum necessary knowledge"]','seed','Chongyu'),
('teaching_principle','Debugging is a learning outcome, not a failure state.','Use bugs as a surface for hypothesis formation, testing and mental-model revision.','["gesture cooldown","student debugging"]','seed','Chongyu'),
('teaching_principle','AI should reduce implementation friction, not remove thinking.','Students can collaborate with AI on implementation while still owning problem definition, architecture, validation and explanation.','["AI Creator curriculum","AI Product Builder curriculum"]','seed','Chongyu'),
('content_insight','Specific student stories beat generic course claims.','Concrete struggle → discovery → improvement stories make student growth visible to parents and produce stronger content angles.','["student growth content"]','seed','Chongyu'),
('business_insight','Translate technical progress into visible growth.','Parent communication should explain what changed in a child’s thinking rather than simply list technologies.','["parent update workflow"]','seed','Chongyu');

insert into content_items(title,pillar,status,source_type,source_label) values
('AI编程不能只是教孩子Prompt','Teaching Philosophy','published','reflection','Course positioning'),
('14岁孩子第一次理解“系统设计”','Student Growth','ready','lesson','Leo · Lesson 06'),
('一个 cooldown，让孩子真正理解 State','Student Growth','draft','lesson','Kevin · Lesson 08'),
('为什么 AI 数据多，不代表数据好？','AI Concepts','idea','lesson','Amy · Lesson 06');

insert into decisions(topic,context,decision,rationale,status,proposed_by,approved_by)
values('When to introduce APIs','Students already understand local components and project flow.','Introduce APIs through a concrete project integration need rather than REST theory.','Architecture should appear when the project needs it.','active','Education Manager','Chongyu');
