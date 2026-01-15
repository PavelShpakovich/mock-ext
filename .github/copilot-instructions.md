# GitHub Copilot Instructions for MockAPI Extension

## Project Overview

This is a Chrome Extension (Manifest V3) for mocking API requests with full control over status codes, delays, and responses. Built with TypeScript, React 19, and Tailwind CSS.

**Stack:**

- TypeScript 5.3.3
- React 19.2.3 + React DOM 19.2.3
- Tailwind CSS 4.x (with @tailwindcss/postcss)
- Webpack 5.104.1
- Jest + Testing Library
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
├── components/             # React components
│   ├── ui/                 # Reusable UI components (Button, Input, Card, etc.)
│   └── *.tsx               # Feature components (App, RuleEditor, RulesTab, etc.)
├── contexts/               # React contexts (I18n)
├── helpers/                # Pure utility functions
├── locales/                # Internationalization (en.json, ru.json)
└── __tests__/              # Jest tests
```

#### Helper Functions Organization

All helper modules should export pure, testable functions:

```typescript
// src/helpers/validation.ts
export function isValidJSON(str: string): boolean { ... }

// src/helpers/urlMatching.ts
export function matchURL(url: string, pattern: string, type: MatchType): boolean { ... }

// src/helpers/string.ts
export function escapeRegExp(string: string): string { ... }
```

## Code Style & Patterns

### TypeScript

#### 1. Type Safety

- Always use explicit types for function parameters and return values
- Use union types for restricted values: `type MatchType = 'wildcard' | 'exact' | 'regex'`
- Define interfaces for all data structures in `src/types.ts`
- Use `Record<string, string>` for key-value objects
- Prefer type-safe optional properties: `headers?: Record<string, string>`

```typescript
// ✅ Good
function validateRule(rule: MockRule): boolean {
  return rule.name.trim().length > 0;
}

// ❌ Bad
function validateRule(rule: any) {
  return rule.name.trim().length > 0;
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

### Refactoring Best Practices

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

#### 3. Reduce Nesting

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

#### 4. DRY (Don't Repeat Yourself)

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
// Types
import { MockRule, Settings, RequestLog } from '../types';

// UI Components
import { Button } from './ui/Button';
import { Input } from './ui/Input';

// Helpers
import { matchURL } from '../helpers/urlMatching';
import { isValidJSON } from '../helpers/validation';

// Context
import { useI18n } from '../contexts/I18nContext';

// Storage
import { Storage } from '../storage';

// Icons (lucide-react)
import { Trash2, Copy, Plus, Edit } from 'lucide-react';

// Utilities
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
```

### Naming Conventions

- **Components**: PascalCase (`RuleEditor`, `Button`)
- **Files**: camelCase for helpers (`urlMatching.ts`), PascalCase for components
- **Functions**: camelCase (`validateRule`, `matchURL`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_LOG_ENTRIES`, `DEFAULT_SETTINGS`)
- **Interfaces/Types**: PascalCase (`MockRule`, `MessageAction`)
- **CSS Classes**: kebab-case in Tailwind (`bg-gray-900`, `text-white`)

### When Adding New Features

1. **Add types** to `src/types.ts` first
2. **Add translations** to `en.json` and `ru.json`
3. **Create helpers** in `src/helpers/` for logic
4. **Update storage** if persistence needed
5. **Create UI components** in `src/components/`
6. **Write tests** in `src/__tests__/`
7. **Update interceptor** if affecting request handling
8. **Update CHANGELOG.md**

Remember: **Maintainability > Cleverness**. Write clear, simple code that others can understand and modify easily.
