# MASTER PROMPT FOR CLAUDE CODE
## Build the IT Services Support Technician Real-World 3D Lab Academy

You are Claude Code acting as the lead software architect, senior IT support instructor, lab designer, UX designer, curriculum developer, and local-AI integration engineer.

Build a production-quality educational web application that turns the supplied Westminster Schools IT Services Support Technician job description into a realistic hands-on IT support training academy.

### PRIMARY GOAL

The learner's goal is employment readiness.

Do NOT build a generic quiz app or a collection of articles. Build an interactive simulation where the learner performs realistic IT support work, makes decisions, troubleshoots systems, documents tickets, communicates with users, escalates appropriately, and completes technology projects.

The application must teach the learner HOW to think and work like an IT Services Support Technician.

The application must never falsely promise employment. It should measure job-readiness against the requirements and produce a portfolio-style record of completed labs.

### CORE EXPERIENCE

Create a visually polished 3D/interactive school technology environment.

The learner should be able to enter simulated locations such as:
- IT Service Desk
- Faculty Office
- Classroom
- Computer Lab
- Network Closet
- Help Desk
- Equipment Storage
- Apple/iPad Deployment Area
- Server/Infrastructure Room
- Conference Room

Use lightweight browser-friendly 3D/WebGL where practical. If full 3D would hurt performance, use a hybrid approach: 3D environments for exploration plus high-quality interactive panels for technical work.

The simulation should feel like a real school campus rather than a game with meaningless graphics.

### LAB DESIGN

Implement the 48 labs from the provided lab workflow package plus the final capstone.

Every lab must contain:

1. Real-world scenario
2. User persona
3. Location
4. Business/educational impact
5. Initial ticket
6. Observable symptoms
7. Available tools
8. Objectives
9. Required actions
10. Evidence collection
11. Decision points
12. Troubleshooting workspace
13. Ticket documentation
14. Resolution validation
15. Customer communication
16. Escalation decision
17. Post-resolution follow-up
18. Score
19. Instructor/tutor feedback
20. Debrief
21. Knowledge-base opportunity
22. Job skill mapping

Do not give the solution immediately.

### TUTOR AI — CRITICAL RULE

Integrate local Ollama as the primary AI tutor.

The AI is a TUTOR, NOT AN ANSWER MACHINE.

When the learner asks for help:
- Ask diagnostic questions.
- Give progressively stronger hints.
- Point the learner toward relevant evidence.
- Explain concepts only when necessary.
- Ask the learner what they think the evidence means.
- Make the learner choose the next troubleshooting step.
- Never reveal the final answer before the learner has demonstrated reasonable effort.
- Never provide a complete command sequence when a smaller hint is sufficient.
- Do not solve a lab for the learner.
- Do not fabricate system results.
- Do not claim an action occurred unless the application actually performed it.
- If the learner is stuck, use a Hint Ladder.

Hint Ladder:
Level 1: Socratic question
Level 2: Conceptual clue
Level 3: Point to the relevant diagnostic area
Level 4: Suggest two possible hypotheses
Level 5: Ask learner to select the next test
Level 6: Provide a narrow procedural hint
Level 7: If the learner has genuinely attempted the task, provide an instructor explanation AFTER recording the learning event.

The tutor should say things such as:
"What evidence do you have that this is a DNS problem?"
"What changed immediately before the issue appeared?"
"Before changing anything, what would you test to separate a client problem from a network-wide problem?"

Do not say:
"Run these commands and the answer is X."

### AI MODEL ROUTING

Primary:
- Ollama running locally.
- Detect Ollama availability automatically.
- Discover installed models from /api/tags.
- Let the user select an installed model in Settings.
- Prefer lightweight/free models suitable for the learner's PC.

Fallback:
- OpenRouter only when explicitly configured by the user.
- Support free models exposed by the current OpenRouter catalog.
- Never hard-code a model that may disappear.
- Clearly label whether the tutor is using Ollama or OpenRouter.
- Never require a paid API key for the default learning experience.

Create:
- AI provider settings
- Connection test
- Model discovery
- Model selection
- Temperature/context controls appropriate for tutoring
- Conversation history per lab
- Token/context safeguards
- Error handling when Ollama is offline
- Fallback routing

### AI TUTOR SYSTEM PROMPT

The tutor must receive:
- Current lab
- Learner's objective
- Current lab state
- Actions already attempted
- Evidence collected
- Ticket contents
- Current score
- Hint level
- Relevant skill requirements
- Previous mistakes

The tutor must prioritize coaching over answering.

The tutor should recognize common troubleshooting methodology:
- Identify
- Scope
- Reproduce
- Gather evidence
- Form hypothesis
- Test
- Change
- Validate
- Document
- Follow up

### 3D LAB INTERACTION

Create interactable objects.

Example classroom:
- Teacher computer
- Projector
- HDMI/USB-C adapter
- Network port
- Wi-Fi
- Telephone
- Printer
- Classroom display
- Speakers
- Help request button

The learner should be able to inspect objects and open technical panels.

Example:
Click projector -> power status, input source, signal state.
Click computer -> OS, network, display settings, event/log interface.
Click network port -> link status.
Click ticket -> service desk workflow.

Do not make 3D objects decorative only. They should provide useful evidence.

### JOB SKILLS TO TRAIN

The curriculum must map directly to:
- Customer service/help desk
- Apple hardware
- macOS
- iOS/iPadOS
- Google Workspace
- Windows
- JAMF/MDM
- Ticketing systems
- SLA management
- Escalation
- Hardware/software diagnosis
- System builds
- Upgrades
- Maintenance
- Networking
- Printers/copiers
- Projectors/displays
- Telephones/VoIP
- Inventory
- Asset lifecycle
- Repair
- RMA
- Vendor coordination
- Technology projects
- End-user training
- Documentation
- Post-resolution follow-up
- Major incidents
- 24/7 support
- Process improvement
- CIO communication

### STUDY PLAN

Build an integrated timeline.

Default:
12 weeks, approximately 10–12 hours/week.

Each week should include:
- Learning objectives
- Labs
- Technical study
- AI tutoring
- Hands-on practice
- Documentation practice
- Interview practice
- Weekly assessment
- Job-readiness checkpoint

Allow the learner to switch between:
- 6-week intensive
- 8-week accelerated
- 12-week standard
- 16-week part-time

Do not reduce the actual competencies when changing schedules.

### REALISTIC TICKET SYSTEM

Build a simulated ticketing system.

Ticket fields:
- Ticket ID
- Requester
- Role
- Contact channel
- Category
- Subcategory
- Priority
- Impact
- Urgency
- SLA
- Assigned technician
- Status
- Description
- Troubleshooting notes
- Evidence
- Resolution
- Escalation
- Related asset
- Related incident
- Customer follow-up
- Closure reason

Teach the learner to distinguish:
- Incident
- Service request
- Problem
- Change
- Major incident

### SCORING

Score technical and professional behavior separately.

Technical:
- Diagnosis
- Evidence
- Troubleshooting
- Correct resolution
- Validation

Professional:
- Customer communication
- Documentation
- Prioritization
- SLA awareness
- Escalation
- Security awareness
- Process discipline

Penalize:
- Random troubleshooting
- Making destructive changes without evidence
- Closing tickets without validation
- Ignoring business impact
- Skipping documentation
- Giving users incorrect information

Reward:
- Evidence-driven troubleshooting
- Safe changes
- Good communication
- Correct escalation
- Strong documentation
- Root-cause thinking

### JOB-READINESS DASHBOARD

Create a dashboard showing:
- Overall readiness
- Apple readiness
- Windows readiness
- Google Workspace readiness
- Networking readiness
- Ticketing readiness
- MDM/JAMF readiness
- Hardware lifecycle readiness
- Classroom technology readiness
- Customer service readiness
- Project management readiness
- Documentation readiness
- Incident response readiness

Use status:
- Not Started
- Learning
- Developing
- Job Ready
- Strong

Require evidence before marking a skill Job Ready.

### PORTFOLIO

Automatically generate a learner portfolio containing:
- Completed labs
- Skills demonstrated
- Troubleshooting case studies
- Screenshots/evidence
- Ticket examples
- Project plans
- Knowledge-base articles
- Training materials
- Capstone report
- Readiness assessment

Do not invent experience. Label everything as lab/simulation experience.

### CAPSTONE

Implement the final simulated school IT command-center scenario.

Multiple incidents arrive simultaneously:
- Projector failures
- Google Drive permissions
- iPad application deployment
- Slow Windows computer
- Offline printer
- macOS Wi-Fi failure
- Vendor replacement
- Parent account issue
- CIO status request

The learner must prioritize and resolve them.

The AI tutor should become less helpful as the learner demonstrates competence.

At the end, generate a detailed instructor report:
- strengths
- weaknesses
- recurring troubleshooting mistakes
- missing competencies
- recommended labs to repeat
- interview topics to study
- readiness percentage by competency

### USER EXPERIENCE

Design for a professional IT training environment.

Use:
- Dark/light theme
- Responsive layout
- Clear navigation
- Modern dashboard
- 3D campus/lab scenes
- Technical terminal panels
- Device inspection panels
- Ticket interface
- AI tutor panel
- Progress timeline
- Skill map
- Achievements that reflect actual competency

Avoid childish gamification.

### OFFLINE-FIRST

The lab content must work without an internet connection.

Ollama should work locally.

The learner should be able to:
- Save progress
- Resume labs
- Review evidence
- Review tickets
- Continue tutor conversations

OpenRouter is optional fallback only.

### IMPLEMENTATION PROCESS

Before coding:
1. Inspect the existing repository.
2. Identify the current framework.
3. Preserve working functionality.
4. Create an architecture plan.
5. Create a feature matrix mapping every requirement to implementation.
6. Build incrementally.
7. Run tests after every major feature.
8. Fix errors instead of hiding them.
9. Do not replace working code unnecessarily.

Build in phases:
Phase 1: architecture and database
Phase 2: curriculum/lab engine
Phase 3: ticketing simulation
Phase 4: 3D environment
Phase 5: technical interaction engine
Phase 6: Ollama tutor
Phase 7: OpenRouter fallback
Phase 8: scoring/readiness
Phase 9: portfolio
Phase 10: capstone
Phase 11: QA/performance/accessibility

### TECHNICAL QUALITY

Require:
- Type safety where supported
- Componentized architecture
- Secure configuration
- No exposed API secrets
- Error boundaries
- Loading states
- Empty states
- Validation
- Persistent progress
- Automated tests
- Responsive design
- Accessibility
- Performance optimization

Never hard-code secrets.

Never make external destructive changes without explicit authorization.

### COMPLETION STANDARD

Do not stop after creating screens.

A feature is not complete until:
- It is implemented.
- It is connected to real application state.
- It persists correctly.
- It can be tested.
- Errors are handled.
- The user can actually use it.
- The AI tutor follows the no-answer rule.
- The lab has measurable competency outcomes.

At the end, provide:
- What was implemented
- What remains
- How to start the app
- How to configure Ollama
- How to configure optional OpenRouter
- How to run the tests
- How to begin Week 1
