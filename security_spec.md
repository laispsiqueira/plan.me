# Security Specification & Threat Model for plan.me

## 1. Data Invariants & Zero-Trust Access Control
1. **User Isolation Principle**: Each user owns their root path `/users/{userId}`. No user can read, list, modify, or delete any sub-collections (`tasks`, `habits`, `timeBlocks`, `respiteTasks`, `wheelOfLife`, `dailyCheckins`, `eras`, `milestones`) belonging to another user.
2. **Identity Integrity**: All written records in sub-collections must have `request.auth != null` and `request.auth.uid == userId`.
3. **No Unauthenticated Reads/Writes**: Anonymous or public access is completely denied by default.
4. **No Blanket Reads**: Catch-all root match defaults to `allow read, write: if false;`.

## 2. The Dirty Dozen Threat Payloads (Must Return PERMISSION_DENIED)
1. **P1 (Cross-User Task Read)**: User B attempts to read `/users/userA/tasks/task1`.
2. **P2 (Cross-User Task List)**: User B attempts to list `/users/userA/tasks`.
3. **P3 (Cross-User Task Injection)**: User B attempts to create a task in `/users/userA/tasks/taskX`.
4. **P4 (Cross-User Task Delete)**: User B attempts to delete `/users/userA/tasks/task1`.
5. **P5 (Unauthenticated Write)**: Unauthenticated visitor attempts to create user profile in `/users/anon1`.
6. **P6 (Ghost Field Injection / Shadow Update)**: User A attempts to write an unauthorized admin field `isAdmin: true` into `/users/userA`.
7. **P7 (Root Document Scraping)**: User A attempts to list all users in `/users`.
8. **P8 (Cross-User Habit Modification)**: User B attempts to alter completion dates in `/users/userA/habits/habit1`.
9. **P9 (Cross-User TimeBlock Hijack)**: User B attempts to overwrite schedule in `/users/userA/timeBlocks/block1`.
10. **P10 (Unauthenticated Wheel of Life Read)**: Unauthenticated visitor attempts to read `/users/userA/wheelOfLife/2026-1`.
11. **P11 (ID Spoofing via Invalid Path)**: User A attempts to write with an invalid UID mismatch or path traversal.
12. **P12 (Cross-User Era Tampering)**: User B attempts to modify `/users/userA/eras/era1`.
