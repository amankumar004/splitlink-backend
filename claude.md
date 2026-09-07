# SplitLink — Claude Code Project Guide

## 1. Project Overview

SplitLink is a temporary, anonymous expense-splitting web application.

The core idea is similar to Splitwise, but without requiring users to:

- create an account
- log in
- provide an email
- maintain permanent expense history

A user can create a temporary split/trip, share a link with other people, and collaboratively track expenses.

When the split expires, all associated data is permanently deleted.

### Core User Flow

```text
Create Split
     ↓
Choose title, currency and expiry
     ↓
Generate temporary trip link
     ↓
Share link with others
     ↓
Guests join using the link
     ↓
Enter their name
     ↓
Add expenses
     ↓
Calculate balances
     ↓
Generate settlements
     ↓
Users settle debts
     ↓
Trip expires
     ↓
All trip data is permanently deleted
```
