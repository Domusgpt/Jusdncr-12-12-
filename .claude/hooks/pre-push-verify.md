# Pre-Push Verification Protocol

## Required Before Every Push

Before committing and pushing code changes, Claude MUST:

### 1. Run TypeScript Check
```bash
npm run build 2>&1 | tail -50
```

### 2. Analyze Output
- Check for `error TS` in output
- If errors found, fix them before pushing
- Document what was fixed

### 3. Create Analysis Report
Include in commit message:
- What issue was identified
- What fix was applied
- Build verification status

### 4. Example Commit Format
```
fix: [description]

## Pre-Push Analysis Report

### Issue Identified
- [describe the issue]

### Fix Applied
- [describe the fix]

### Build Verification
- npm run build: PASSED/FAILED
- Errors fixed: [count]
```

## Common TypeScript Errors

### Type Narrowing Issues
- When using ternary chains, TypeScript narrows types aggressively
- Use initializer functions or intermediate variables to avoid

### Union Type Comparisons
- `as const` makes object properties literal types
- Define explicit interfaces with union types for flexibility

### Missing Type Definitions
- Run `npm install --save-dev @types/[package]` for missing types
