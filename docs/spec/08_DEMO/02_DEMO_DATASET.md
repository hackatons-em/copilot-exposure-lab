# Demo Dataset

## Company
Acme Health Finance Ltd.

## Users
- Alice Wong, HR Director.
- Bob Novak, Product Manager.
- Nina Shah, Security Architect.
- Omar Eriksson, M365 Admin.
- Carla Mendes, Legal Counsel.
- Dev Patel, Contractor.
- Grace Miller, CFO.
- Helena Kim, CEO.

## Groups
- Everyone Except External Users.
- HR Leadership.
- Finance Leadership.
- Legal Team.
- Sales Team.
- Engineering Team.
- Contractors.
- Executive Team.

## Sites
- HR Portal.
- Customer Contracts.
- Board Room.
- Security Team.
- Product Team.
- Marketing.
- Project Phoenix.

## Sensitive files
- `/HR/Compensation/2026_salary_plan.xlsx`
- `/Customer Contracts/BankCo/master_services_agreement.pdf`
- `/Board Room/2026_acquisition_strategy.pptx`
- `/Security Team/incidents/token_rotation_notes.docx`
- `/Project Phoenix/confidential_launch_plan.docx`

## Intentional issues
1. HR salary file has org-wide link.
2. Customer contracts grants broad Sales access.
3. Board site inherited broad read.
4. Contractor still has Project Phoenix access.
5. Security doc missing label.
6. Helpdesk agent has email/send action.
7. Agent owner is departed maker.
