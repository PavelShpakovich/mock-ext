import { fireEvent, render, screen } from '@testing-library/react';
import App from '../components/App';
import { Tab, ToastType } from '../enums';

const rulesManager = {
  rules: [],
  ruleWarnings: new Map(),
  loadRules: jest.fn(),
  saveRules: jest.fn(),
  saveRule: jest.fn(),
  deleteRule: jest.fn(),
  toggleRule: jest.fn(),
  duplicateRule: jest.fn(),
  resetRuleHits: jest.fn(),
};
const proxyRulesManager = {
  proxyRules: [],
  loadProxyRules: jest.fn(),
  saveProxyRules: jest.fn(),
  saveProxyRule: jest.fn(),
  deleteProxyRule: jest.fn(),
  toggleProxyRule: jest.fn(),
  duplicateProxyRule: jest.fn(),
  resetProxyRuleHits: jest.fn(),
};
const foldersManager = {
  folders: [],
  loadFolders: jest.fn(),
  saveFolders: jest.fn(),
  saveFolder: jest.fn(),
  deleteFolderAndUpdateRules: jest.fn(),
  toggleCollapse: jest.fn(),
};
const recording = {
  settings: { enabled: true, logRequests: false, showNotifications: false, corsAutoFix: false },
  requestLog: [],
  activeTabTitle: '',
  loadSettings: jest.fn(),
  loadRequestLog: jest.fn(),
};
let workspaceProps: { activeTab: Tab };

jest.mock('../contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
jest.mock('../hooks', () => ({
  useStandaloneWindowStatus: jest.fn(() => false),
  useRulesManager: jest.fn(() => rulesManager),
  useProxyRulesManager: jest.fn(() => proxyRulesManager),
  useFoldersManager: jest.fn(() => foldersManager),
  useRecording: jest.fn(() => recording),
  useImportExport: jest.fn(() => ({
    handleExportRules: jest.fn(),
    handleExportProxyRules: jest.fn(),
    handleImportRules: jest.fn(),
    handleImportProxyRules: jest.fn(),
    handleConfirmImport: jest.fn(),
  })),
  useCrossContextSync: jest.fn(),
  useDragDropHandlers: jest.fn(),
  useAppActions: jest.fn((options: { setEditingFolder: (value: string) => void; setToast: (value: null) => void }) => ({
    handleSaveRule: jest.fn(),
    handleDeleteRule: jest.fn(),
    handleMockRequest: jest.fn(),
    handleEditRule: jest.fn(),
    handleSaveProxyRule: jest.fn(),
    handleDeleteProxyRule: jest.fn(),
    handleProxyRequest: jest.fn(),
    handleEditProxyRule: jest.fn(),
    handleRecordingToggle: jest.fn(),
    handleCreateFolder: () => options.setEditingFolder('new'),
    handleEditFolder: jest.fn(),
    handleSaveFolder: jest.fn(),
    handleDeleteFolder: jest.fn(),
    handleEnableFolderRules: jest.fn(),
    handleDisableFolderRules: jest.fn(),
    handleCloseToast: () => options.setToast(null),
  })),
}));
jest.mock('../components/AppWorkspace', () => ({
  __esModule: true,
  default: (props: { activeTab: Tab; onCreateFolder: () => void }) => {
    workspaceProps = { activeTab: props.activeTab };
    return (
      <div>
        <button onClick={props.onCreateFolder}>open-folder-editor</button>
        <span>{props.activeTab}</span>
      </div>
    );
  },
}));
jest.mock('../components/FolderEditor', () => ({
  __esModule: true,
  default: () => <div data-testid='folder-editor' />,
}));
jest.mock('../components/StandaloneWindowOverlay', () => ({
  __esModule: true,
  default: () => <div data-testid='standalone-overlay' />,
}));
jest.mock('../components/ui/ImportDialog', () => ({ ImportDialog: () => <div data-testid='import-dialog' /> }));
jest.mock('../components/ui/ConfirmDialog', () => ({ ConfirmDialog: () => <div data-testid='confirm-dialog' /> }));
jest.mock('../components/ui/Toast', () => ({
  Toast: ({ type, message }: { type: ToastType; message: string }) => (
    <div>
      {type}:{message}
    </div>
  ),
}));
jest.mock('../helpers/context', () => ({ isDevTools: jest.fn(() => true) }));

describe('App orchestration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    recording.settings = { enabled: true, logRequests: false, showNotifications: false, corsAutoFix: false };
  });

  it('loads managers on mount and forwards workspace folder actions', () => {
    render(<App />);
    expect(rulesManager.loadRules).toHaveBeenCalledTimes(1);
    expect(proxyRulesManager.loadProxyRules).toHaveBeenCalledTimes(1);
    expect(foldersManager.loadFolders).toHaveBeenCalledTimes(1);
    expect(recording.loadSettings).toHaveBeenCalledTimes(1);
    expect(recording.loadRequestLog).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'open-folder-editor' }));
    expect(screen.getByTestId('folder-editor')).toBeInTheDocument();
    expect(workspaceProps.activeTab).toBe(Tab.Rules);
  });

  it('opens standalone overlay only when the window status and DevTools context are both active', () => {
    const hooks = require('../hooks');
    hooks.useStandaloneWindowStatus.mockReturnValue(true);
    render(<App />);
    expect(screen.getByTestId('standalone-overlay')).toBeInTheDocument();
  });
});
