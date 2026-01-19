# GitHub Copilot Instructions for Moq Extension

## Project Overview

This is a Chrome Extension (Manifest V3) for mocking API requests with full control over status codes, delays, and responses. Built with TypeScript, React 19, and Tailwind CSS.

**Stack:**

- TypeScript 5.3.3
- React 19.2.3 + React DOM 19.2.3
- Tailwind CSS 4.x (with @tailwindcss/postcss)
- Webpack 5.104.1
- Jest + Testing Library (194 tests, 76% coverage)
- Chrome Extension Manifest V3

## Architecture Patterns

### Extension Architecture

- **Manifest V3** with isolated worlds and service worker
- **MAIN world interceptor** (`src/interceptor.ts`) - Intercepts fetch/XHR before they leave browser
- **ISOLATED world content script** (`src/content-script.ts`) - Bridge between page and extension
- **Service worker background** (`src/background.ts`) - Handles cross-tab messaging and storage
- **React popup** (`src/popup.tsx`) - User interface

### Code Organization

#### File Structure Convention

```
src/
├── *.ts                    # Core scripts (background, content-script, interceptor, storage)
├── types.ts                # Central type definitions
├── enums.ts                # Centralized enums (MatchType, HttpMethod, etc.)
├── components/             # React components
│   ├── ui/                 # Reusable UI components (Button, Input, Card, atomic components)
│   └── *.tsx               # Feature components (App, RuleEditor, RulesTab, etc.)
├── contexts/               # React contexts (I18n)
├── helpers/                # Pure utility functions (modular architecture - v2.5.0)
│   ├── recording.ts        # Recording functionality (tab validation, messages, settings)
│   ├── importExport.ts     # Import/export logic (validation, merging, statistics)
│   ├── headers.ts          # HTTP header utilities (conversion, extraction, filtering)
│   ├── ruleForm.ts         # Form data initialization from rules/requests
│   ├── ruleValidation.ts   # Enhanced validation (detailed JSON, form validation)
│   ├── urlMatching.ts      # URL pattern matching logic
│   ├── filtering.ts        # Request filtering logic
│   ├── formatting.ts       # Data formatting utilities
│   ├── time.ts             # Time formatting utilities
│   ├── string.ts           # String manipulation utilities
│   └── validation.ts       # General validation functions
├── locales/                # Internationalization (en.json, ru.json)
└── __tests__/              # Jest tests (comprehensive coverage for all helpers)
    ├── recording.test.ts   # Recording helpers tests (12 tests)
    ├── importExport.test.ts # Import/export tests (22 tests)
    ├── headers.test.ts     # Headers utilities tests (11 tests)
    ├── ruleForm.test.ts    # Form initialization tests (12 tests)
    ├── ruleValidation.test.ts # Validation tests (enhanced with 19 tests)
    └── ...                 # Other test files
```

#### Helper Functions Organization (New in v2.5.0)

**All helper modules export pure, testable functions with comprehensive unit tests:**

```typescript
// src/helpers/recording.ts - Recording functionality
export function isValidRecordingTab(tab: chrome.tabs.Tab): boolean { ... }
export function findValidWebTab(): Promise<chrome.tabs.Tab | null> { ... }
export function sendStartRecordingMessage(tabId: number): void { ... }
export function createUpdatedSettings(current: Settings, updates: Partial<Settings>): Settings { ... }

// src/helpers/importExport.ts - Import/export logic
export function downloadFile(filename: string, content: string): void { ... }
export function exportRulesToJSON(rules: MockRule[], selectedIds?: string[]): string { ... }
export function validateImportedRules(data: any): ValidationResult { ... }
export function mergeRules(existing: MockRule[], imported: MockRule[]): MockRule[] { ... }
export function calculateImportStats(existing: MockRule[], imported: MockRule[]): ImportStats { ... }
export function getNewAndDuplicateRules(existing: MockRule[], imported: MockRule[]): ImportPreview { ... }

// src/helpers/headers.ts - HTTP header utilities
export function convertHeadersToArray(headers?: Record<string, string>): HeaderEntry[] { ... }
export function convertArrayToHeaders(headers: HeaderEntry[]): Record<string, string> | undefined { ... }
export function extractCapturedHeaders(request?: RequestLog | null): HeaderEntry[] { ... }

// src/helpers/ruleForm.ts - Form data initialization
export function getInitialFormData(rule: MockRule | null, mockRequest: RequestLog | null): RuleFormData { ... }

// src/helpers/ruleValidation.ts - Enhanced validation (v2.5.0)
export function validateJSONDetailed(jsonString: string): JSONValidation { ... }
export function validateRuleForm(formData: any, jsonValidation: JSONValidation | null, t: TranslateFn): FormValidationErrors { ... }

// src/helpers/urlMatching.ts - URL matching
export function matchURL(url: string, pattern: string, type: MatchType): boolean { ... }

// src/helpers/validation.ts - General validation
export function isValidJSON(str: string): boolean { ... }
```

### Component Architecture (Refactored in v2.5.0)

#### Size Reduction & Modularization

**Major components refactored for better maintainability:**

- `App.tsx`: **400 → 280 lines (-30%)** - Extracted recording and import/export logic to helpers
- `RuleEditor.tsx`: **400 → 280 lines (-30%)** - Extracted header utilities and form logic to helpers
- `ImportDialog.tsx`: **155 → 129 lines (-18%)** - Uses atomic components and helper functions

#### Atomic UI Components (New in v2.5.0)

**Small, reusable components following atomic design principles:**

```typescript
// src/components/ui/RadioOption.tsx (43 lines)
// Reusable radio button with label and description
<RadioOption
  name="mode"
  value={ImportMode.Merge}
  checked={mode === ImportMode.Merge}
  onChange={() => setMode(ImportMode.Merge)}
  title="Merge Mode"
  description="Add new rules and keep existing ones"
  hoverColor="green"
/>

// src/components/ui/StatItem.tsx (17 lines)
// Icon + label + value statistics display
<StatItem
  icon={CheckCircle}
  iconColor="text-green-500"
  label="New Rules"
  value={5}
/>

// src/components/ui/DialogHeader.tsx (17 lines)
// Consistent modal header with close button
<DialogHeader
  title="Import Preview"
  onClose={onCancel}
  closeLabel="Cancel"
/>

// src/components/ui/InfoPanel.tsx (19 lines)
// Contextual information panels with variants
<InfoPanel variant="info">
  {/* Statistics or information content */}
</InfoPanel>

// src/components/ui/HeadersEditor.tsx (72 lines)
// Reusable HTTP headers editor component
<HeadersEditor
  headers={headers}
  onChange={setHeaders}
  error={errors.headers}
/>
```

**Benefits:**

- **Reusability**: Components can be used across different features
- **Consistency**: Uniform styling and behavior
- **Maintainability**: Small, focused components are easier to test and modify
- **Composability**: Build complex UIs from simple building blocks

## Code Style & Patterns

### TypeScript

#### 1. Type Safety

- Always use explicit types for function parameters and return values
- Use **enums** from `src/enums.ts` for restricted values: `MatchType`, `HttpMethod`, `ImportMode`, etc.
- Define interfaces for all data structures in `src/types.ts`
- Use `Record<string, string>` for key-value objects
- Prefer type-safe optional properties: `headers?: Record<string, string>`

```typescript
// ✅ Good - Using enum
import { MatchType } from '../enums';
function validateRule(rule: MockRule): boolean {
  return rule.matchType === MatchType.Wildcard;
}

// ❌ Bad - Using string literals
function validateRule(rule: any) {
  return rule.matchType === 'wildcard';
}
```

#### 2. Strict Mode

- Enable all strict TypeScript checks
- No `any` types unless absolutely necessary (e.g., Chrome API edge cases)
- Use `unknown` for truly unknown types, then narrow with type guards
- No unused locals or parameters
- All code paths must return values

#### 3. Interfaces vs Types

- Use `interface` for object shapes that might be extended
- Use `type` for unions, primitives, and utility types
- Centralize all types in `src/types.ts`

### React Patterns

#### 1. Functional Components

Always use functional components with TypeScript:

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  // Component logic
};
```

**Key Points:**

- Export as named exports for UI components
- Extend HTML element props when wrapping native elements
- Use default parameters for optional props
- Destructure props in function signature
- Spread remaining props with `...props`

#### 2. Component Organization

**Section Comments:**
Use clear section separators in large files:

```typescript
// ============================================================================
// Header Utilities
// ============================================================================

function convertHeadersToArray(headers?: Record<string, string>) { ... }

// ============================================================================
// Validation Helpers
// ============================================================================

function validateFormData(formData: any) { ... }

// ============================================================================
// Component
// ============================================================================

const RuleEditor: React.FC<Props> = () => { ... }
```

**Extract Helper Functions:**
Extract complex logic outside components:

```typescript
// ✅ Good - Helper function extracted
function getInitialFormData(rule: MockRule | null) {
  return {
    name: rule?.name || '',
    urlPattern: rule?.urlPattern || '',
    // ...
  };
}

const Component = () => {
  const [formData, setFormData] = useState(() => getInitialFormData(rule));
};

// ❌ Bad - Inline complexity
const Component = () => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    urlPattern: rule?.urlPattern || '',
    // ... 20 more lines
  });
};
```

#### 3. Hooks Usage

- Use `useState` for local component state
- Use `useEffect` for side effects (load data, subscriptions)
- Use `useCallback` for memoized callbacks passed to children
- Use `useRef` for DOM refs and mutable values
- Use custom contexts for global state (I18n)

```typescript
// Custom hook pattern
function useRequestLog() {
  const [log, setLog] = useState<RequestLog[]>([]);

  const loadLog = useCallback(async () => {
    const loaded = await Storage.getRequestLog();
    setLog(loaded);
  }, []);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  return { log, loadLog };
}
```

### Styling with Tailwind CSS

#### 1. Design System

**Colors (Dark Theme):**

- Background: `bg-gray-900` (main), `bg-gray-800` (secondary), `bg-gray-950` (deep)
- Borders: `border-gray-700`, `border-gray-800`, `border-gray-600`
- Text: `text-white` (primary), `text-gray-300` (secondary), `text-gray-500` (tertiary)
- Primary Action: `bg-green-600` → `hover:bg-green-700`
- Danger: `bg-red-900/30` + `border-red-900` → `hover:bg-red-900/50`
- Success: `text-green-400`, `border-green-500`
- Warning: `text-yellow-500`

**Spacing:**

- Component padding: `p-4` (list items), `p-8` (cards), `p-6` (sections)
- Gaps: `gap-2` (tight), `gap-3` (normal), `gap-4` (loose)
- Margins: `mb-2`, `mb-4`, `mb-6`

**Shadows & Effects:**

- Cards: `shadow-sm` default, `shadow-lg` on hover
- Focus rings: `focus:ring-2 focus:ring-green-500/50`
- Transitions: `transition-all` for smooth effects
- Hover: Increase shadow and brightness

#### 2. Component Styling Pattern

Use `clsx` for conditional classes:

```typescript
import clsx from 'clsx';

<div
  className={clsx(
    'base-classes here',
    {
      'conditional-class': condition,
      'another-class': anotherCondition,
    },
    className  // Allow className override
  )}
>
```

#### 3. Responsive Design

- Mobile-first approach
- Use `sm:`, `md:`, `lg:` breakpoints
- Stack on mobile: `flex flex-col sm:flex-row`
- Adjust text size: `text-sm sm:text-base`

#### 4. Common UI Patterns

**Card with Hover Effect:**

```typescript
<Card
  className={clsx({
    'opacity-60 bg-gray-800/50': !enabled,
  })}
  hoverEffect={true}
>
```

**Icon Buttons:**

```typescript
<IconButton
  variant='danger'
  onClick={onDelete}
  title={t('common.delete')}
>
  <TrashIcon className='w-5 h-5' />
</IconButton>
```

**Form Inputs with Labels:**

```typescript
<Input
  label={t('editor.ruleName')}
  required
  value={formData.name}
  onChange={(e) => handleChange('name', e.target.value)}
  error={errors.name}
  placeholder={t('editor.ruleNamePlaceholder')}
/>
```

### Refactoring Best Practices (Learned from v2.5.0 Refactoring)

#### 1. Single Responsibility Principle

Each function should do ONE thing:

```typescript
// ✅ Good - Single responsibility
function isValidRecordingTab(tab: chrome.tabs.Tab): boolean {
  return tab.id !== undefined && !!tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:');
}

function startRecording(tabId: number) {
  chrome.tabs.sendMessage(tabId, { action: 'startRecording' });
}

// ❌ Bad - Multiple responsibilities
function handleRecording(tab: chrome.tabs.Tab) {
  if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.tabs.sendMessage(tab.id, { action: 'startRecording' });
    updateBadge(tab.id);
    saveRecordingState(true);
  }
}
```

#### 2. Extract Helper Functions

Move complex logic outside components:

```typescript
// ✅ Good - Extracted helper
function validateFormData(data: FormData, t: TranslateFn): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) {
    errors.name = t('editor.errors.nameRequired');
  }
  return errors;
}

const Component = () => {
  const validate = () => {
    const errors = validateFormData(formData, t);
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };
};

// ❌ Bad - Inline complexity
const Component = () => {
  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = t('editor.errors.nameRequired');
    }
    // ... 30 more lines
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };
};
```

#### 3. Create Atomic Components

Build small, reusable components for common UI patterns:

```typescript
// ✅ Good - Atomic component
// RadioOption.tsx (43 lines)
export const RadioOption: React.FC<RadioOptionProps> = ({ name, value, checked, onChange, title, description, hoverColor }) => {
  return (
    <label className={clsx('cursor-pointer transition-colors', hoverColorClasses[hoverColor])}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
    </label>
  );
};

// Usage in multiple places
<RadioOption name="mode" value="merge" checked={mode === 'merge'} onChange={handleChange} title="Merge" description="Add new" hoverColor="green" />
<RadioOption name="mode" value="replace" checked={mode === 'replace'} onChange={handleChange} title="Replace" description="Remove all" hoverColor="red" />

// ❌ Bad - Repeated inline JSX (40+ lines repeated)
<label className="cursor-pointer ...">
  <input type="radio" name="mode" value="merge" checked={mode === 'merge'} onChange={handleChange} />
  <div>
    <div className="font-medium">Merge</div>
    <div className="text-sm text-gray-400">Add new rules and keep existing ones</div>
  </div>
</label>
// ... repeat 40+ lines for each radio button
```

#### 4. Reduce Nesting

Use early returns to flatten code:

```typescript
// ✅ Good - Early returns
function processRule(rule: MockRule): Response | null {
  if (!rule.enabled) return null;
  if (!matchesUrl(url, rule.urlPattern)) return null;
  if (rule.method && rule.method !== method) return null;

  return createResponse(rule);
}

// ❌ Bad - Deep nesting
function processRule(rule: MockRule): Response | null {
  if (rule.enabled) {
    if (matchesUrl(url, rule.urlPattern)) {
      if (!rule.method || rule.method === method) {
        return createResponse(rule);
      }
    }
  }
  return null;
}
```

#### 5. DRY (Don't Repeat Yourself)

Extract repeated patterns:

```typescript
// ✅ Good - Reusable function
function updateRulesEverywhere(updatedRules: MockRule[]) {
  setRules(updatedRules);
  Storage.saveRules(updatedRules);
  sendRulesToAllTabs(updatedRules);
}

const handleSaveRule = (rule: MockRule) => {
  const updated = rules.map((r) => (r.id === rule.id ? rule : r));
  updateRulesEverywhere(updated);
};

const handleDeleteRule = (id: string) => {
  const updated = rules.filter((r) => r.id !== id);
  updateRulesEverywhere(updated);
};

// ❌ Bad - Repeated code
const handleSaveRule = (rule: MockRule) => {
  const updated = rules.map((r) => (r.id === rule.id ? rule : r));
  setRules(updated);
  Storage.saveRules(updated);
  sendRulesToAllTabs(updated);
};

const handleDeleteRule = (id: string) => {
  const updated = rules.filter((r) => r.id !== id);
  setRules(updated);
  Storage.saveRules(updated);
  sendRulesToAllTabs(updated);
};
```

#### 6. Write Comprehensive Tests

Always write unit tests for helper functions:

```typescript
// src/__tests__/recording.test.ts
describe('Recording Helpers', () => {
  describe('isValidRecordingTab', () => {
    it('should return true for valid web tabs', () => {
      const validTab: chrome.tabs.Tab = { id: 123, url: 'https://example.com', ... };
      expect(isValidRecordingTab(validTab)).toBe(true);
    });

    it('should return false for chrome:// URLs', () => {
      const tab: chrome.tabs.Tab = { id: 123, url: 'chrome://settings', ... };
      expect(isValidRecordingTab(tab)).toBe(false);
    });
  });
});
```

**Test Guidelines:**

- Test all edge cases (null, undefined, empty strings)
- Mock Chrome APIs using `(globalThis as any).chrome = { ... }`
- Follow pattern: Arrange → Act → Assert
- Group related tests with `describe` blocks
- Use descriptive test names: `it('should handle case when...')`

### Internationalization (i18n)

#### 1. Context Pattern

Use custom i18n context for translations:

```typescript
import { useI18n } from '../contexts/I18nContext';

const Component = () => {
  const { t } = useI18n();
  return <h1>{t('app.name')}</h1>;
};
```

#### 2. Translation Keys

- Use nested keys: `editor.ruleName`, `rules.addRule`
- Keep keys in sync across `en.json` and `ru.json`
- Support interpolation: `"recording": "Recording: {{tabTitle}}"`

```json
{
  "editor": {
    "ruleName": "Rule Name",
    "errors": {
      "nameRequired": "Name is required",
      "nameTooShort": "Name must be at least 3 characters"
    }
  }
}
```

#### 3. Never Hardcode Text

Always use translation keys:

```typescript
// ✅ Good
<Button>{t('rules.addRule')}</Button>

// ❌ Bad
<Button>Add Rule</Button>
```

### Chrome Extension Patterns

#### 1. Message Passing

Use typed messages with action discriminators:

```typescript
interface MessageAction {
  action: 'updateRules' | 'toggleMocking' | 'getRules' | ...;
  rules?: MockRule[];
  enabled?: boolean;
  tabId?: number;
}

// Sending
chrome.runtime.sendMessage({
  action: 'updateRules',
  rules: updatedRules
});

// Receiving
chrome.runtime.onMessage.addListener((message: MessageAction, sender, sendResponse) => {
  switch (message.action) {
    case 'updateRules':
      handleUpdateRules(message.rules!);
      break;
    // ...
  }
});
```

#### 2. Storage Pattern

Use wrapper class for type-safe storage:

```typescript
export class Storage {
  private static readonly RULES_KEY = 'mockRules';

  static async getRules(): Promise<MockRule[]> {
    const result = await chrome.storage.local.get(this.RULES_KEY);
    return result[this.RULES_KEY] || [];
  }

  static async saveRules(rules: MockRule[]): Promise<void> {
    await chrome.storage.local.set({ [this.RULES_KEY]: rules });
  }
}
```

**Storage Types:**

- `chrome.storage.local` - Persistent data (rules, settings)
- `chrome.storage.session` - Tab session data (request logs)

#### 3. Context Checking

Wrap Chrome API calls with context checks:

```typescript
export function withContextCheck<T>(fn: () => T, fallback: T): T {
  try {
    if (!chrome?.runtime?.id) {
      return fallback;
    }
    return fn();
  } catch (error) {
    console.error('Context invalidated:', error);
    return fallback;
  }
}

// Usage
const rules = await withContextCheck(() => Storage.getRules(), []);
```

#### 4. Interceptor (MAIN World)

The interceptor runs in MAIN world and **cannot use ES6 imports**:

```typescript
// ⚠️ IMPORTANT: This code runs in MAIN world
// - Cannot use import statements
// - Must be self-contained
// - Duplicate helper functions if needed
// - Add comments noting duplication

// ⚠️ This method is duplicated from helpers/urlMatching.ts
private matchesPattern(url: string, pattern: string): boolean {
  // Implementation
}
```

### Testing Patterns

#### 1. Jest Configuration

- Use `ts-jest` preset
- Test environment: `jsdom` for React components
- Place tests in `src/__tests__/` directory
- Name test files: `*.test.ts` or `*.test.tsx`

#### 2. Test Structure

```typescript
describe('FeatureName', () => {
  describe('functionName', () => {
    it('should handle expected case', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      // ...
    });
  });
});
```

#### 3. Mock Chrome APIs

```typescript
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
  },
} as any;
```

#### 4. Test Coverage

Maintain minimum 70% coverage:

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Error Handling

#### 1. Try-Catch Pattern

```typescript
// For async operations
async function loadData() {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    console.error('Failed to load data:', error);
    return defaultData;
  }
}

// For validation
function validateJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
```

#### 2. Optional Chaining

Use optional chaining for potentially undefined values:

```typescript
const url = tab?.url || '';
const responseHeaders = mockRequest?.responseHeaders;
```

#### 3. Fallback Values

Always provide fallbacks for storage/async operations:

```typescript
const rules = result[this.RULES_KEY] || [];
const settings = result[this.SETTINGS_KEY] || DEFAULT_SETTINGS;
```

### Performance Patterns

#### 1. Memoization

Use `useCallback` for functions passed to children:

```typescript
const handleSave = useCallback(
  (rule: MockRule) => {
    // Save logic
  },
  [dependencies]
);
```

#### 2. Batching

Batch storage writes to avoid excessive I/O:

```typescript
// Buffer writes
let buffer: RequestLog[] = [];
let timeout: number | null = null;

function scheduleFlush() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => flushBuffer(), 500);
}
```

#### 3. Lazy Initialization

Use lazy initialization for expensive state:

```typescript
const [state, setState] = useState(() => expensiveComputation());
```

## Common Pitfalls to Avoid

### 1. Don't Hardcode Text

❌ Bad: `<button>Save</button>`
✅ Good: `<button>{t('common.save')}</button>`

### 2. Don't Use Inline Styles

❌ Bad: `<div style={{ color: 'red' }}>`
✅ Good: `<div className='text-red-400'>`

### 3. Don't Mutate State

❌ Bad: `rules.push(newRule); setRules(rules);`
✅ Good: `setRules([...rules, newRule]);`

### 4. Don't Ignore TypeScript Errors

❌ Bad: `// @ts-ignore`
✅ Good: Fix the underlying type issue

### 5. Don't Create Deep Nesting

❌ Bad: 5+ levels of nested if statements
✅ Good: Use early returns and extracted functions

### 6. Don't Repeat Code

❌ Bad: Copy-paste same logic in multiple places
✅ Good: Extract into reusable helper function

### 7. Don't Use `any` Type

❌ Bad: `function process(data: any)`
✅ Good: `function process(data: MockRule)`

### 8. Don't Skip Section Comments

❌ Bad: Dump all helpers without organization
✅ Good: Use section comments for large files

### 9. Don't Use Comments in JSX/TSX

❌ Bad: `<!-- This is a comment -->`
❌ Bad: `{/* This is a comment */}`
✅ Good: Extract to constants with descriptive names

**Note:** Instead of comments, use descriptive variable names, component names, or helper functions that make the code self-documenting.

### 10. Always Add Cursor Pointer to Interactive Buttons

❌ Bad: `<button className='bg-green-600'>Click</button>`
✅ Good: `<button className='bg-green-600 cursor-pointer'>Click</button>`

**Note:** All buttons, links, and interactive elements that are NOT disabled must have `cursor-pointer` in their className. This should be included in base button styles.

## File-Specific Patterns

### interceptor.ts

- Runs in MAIN world (no imports)
- Self-contained with duplicated utilities
- Comment duplication: `// ⚠️ Duplicated from helpers/...`
- Test URL matching against patterns
- Capture response headers before mocking

### background.ts

- Service worker (Manifest V3)
- Handle cross-tab communication
- Update badge with active rule count
- Manage storage and logging
- No DOM access

### content-script.ts

- Bridge between page and extension
- Forward messages between worlds
- Inject interceptor script
- Handle devtools prompt

### storage.ts

- Type-safe wrapper for chrome.storage
- Batch writes for performance
- Separate local (persistent) and session (temporary)
- Export constants like DEFAULT_SETTINGS

### Component Files

- Extract helpers above component
- Use section comments
- Keep components focused
- Validate in helpers, not inline

## Quick Reference

### Common Commands

```bash
npm run build          # Production build
npm run dev           # Development watch mode
npm test              # Run tests
npm run test:watch    # Watch mode tests
npm run lint          # Lint TypeScript
npm run format        # Format with Prettier
npm run type-check    # TypeScript check
```

### Import Patterns

```typescript
// Types and Enums
import { MockRule, Settings, RequestLog } from '../types';
import { MatchType, HttpMethod, ImportMode, ButtonVariant } from '../enums';

// UI Components
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { RadioOption } from './ui/RadioOption';
import { StatItem } from './ui/StatItem';
import { DialogHeader } from './ui/DialogHeader';
import { InfoPanel } from './ui/InfoPanel';
import { HeadersEditor } from './ui/HeadersEditor';

// Helpers (v2.5.0 modular architecture)
import { matchURL } from '../helpers/urlMatching';
import { isValidJSON, validateJSONDetailed, validateRuleForm } from '../helpers/validation';
import { isValidRecordingTab, sendStartRecordingMessage } from '../helpers/recording';
import { exportRulesToJSON, mergeRules, calculateImportStats } from '../helpers/importExport';
import { convertHeadersToArray, extractCapturedHeaders } from '../helpers/headers';
import { getInitialFormData } from '../helpers/ruleForm';

// Context
import { useI18n } from '../contexts/I18nContext';

// Storage
import { Storage } from '../storage';

// Icons (lucide-react)
import { Trash2, Copy, Plus, Edit, CheckCircle, AlertCircle } from 'lucide-react';

// Utilities
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
```

### Naming Conventions

- **Components**: PascalCase (`RuleEditor`, `Button`, `RadioOption`)
- **Files**: camelCase for helpers (`urlMatching.ts`, `importExport.ts`), PascalCase for components
- **Functions**: camelCase (`validateRule`, `matchURL`, `isValidRecordingTab`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_LOG_ENTRIES`, `DEFAULT_SETTINGS`)
- **Interfaces/Types**: PascalCase (`MockRule`, `MessageAction`, `ImportStats`)
- **Enums**: PascalCase values (`MatchType.Wildcard`, `HttpMethod.GET`, `ImportMode.Merge`)
- **CSS Classes**: kebab-case in Tailwind (`bg-gray-900`, `text-white`)

### When Adding New Features

1. **Add types** to `src/types.ts` first
2. **Add enums** to `src/enums.ts` if needed (for restricted value sets)
3. **Add translations** to `en.json` and `ru.json`
4. **Create helpers** in `src/helpers/` for business logic
   - Keep functions pure and testable
   - Export individual functions (not default exports)
5. **Create atomic components** in `src/components/ui/` for reusable UI patterns
   - Keep components small (<50 lines when possible)
   - Support variants and customization props
6. **Update storage** if persistence needed
7. **Create feature components** in `src/components/`
   - Extract helpers for complex logic
   - Use atomic components for common patterns
8. **Write comprehensive tests** in `src/__tests__/`
   - Test all edge cases
   - Mock Chrome APIs properly
   - Aim for 70%+ coverage
9. **Update interceptor** if affecting request handling
10. **Update CHANGELOG.md** with user-facing changes
11. **Update README.md** architecture section if needed
12. **Update copilot-instructions.md** with new patterns

**v2.5.0 Refactoring Lessons:**

- Extract business logic BEFORE creating UI
- Create atomic components for repeated UI patterns
- Test helpers immediately after creation
- Keep components under 300 lines
- Use helper functions to reduce component complexity

Remember: **Maintainability > Cleverness**. Write clear, simple code that others can understand and modify easily.
