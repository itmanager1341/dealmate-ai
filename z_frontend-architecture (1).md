# DealMate AI - Frontend Architecture

## 🏗️ Application Structure

### Technology Stack
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Shadcn-ui components + Tailwind CSS
- **State Management**: React Query for server state, React hooks for local state
- **Authentication**: Supabase Auth with protected routes
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **File Storage**: Supabase Storage for document uploads
- **Deployment**: Lovable.dev platform

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn-ui base components
│   ├── AIFileUpload.tsx    # File upload with AI processing
│   ├── DocumentLibrary.tsx # Document management interface
│   ├── DealCard.tsx        # Deal summary cards
│   ├── ExcelChunksView.tsx # Excel data visualization
│   ├── MetricsView.tsx     # Financial metrics display
│   └── TranscriptsView.tsx # Audio transcription results
├── pages/              # Route components
│   ├── Dashboard.tsx       # Main deal overview
│   ├── DealWorkspace.tsx   # Individual deal workspace
│   ├── Upload.tsx          # New deal creation
│   ├── Login.tsx           # Authentication
│   └── Compare.tsx         # Deal comparison tools
├── utils/              # Utility functions
│   └── aiApi.ts           # AI server integration
├── types/              # TypeScript definitions
│   └── index.ts           # Core type definitions
├── lib/                # Configuration
│   └── supabase.ts        # Database client setup
└── hooks/              # Custom React hooks
    └── useFileProcessing.ts # File processing state management
```

## 🔧 Core Components

### AIFileUpload.tsx
**Purpose**: Handles file uploads with intelligent type detection and AI processing
**Key Features**:
- Drag & drop interface with file type validation
- Real-time upload progress tracking
- Automatic file type detection (Audio/Excel/Document)
- Integration with Supabase storage
- Processing method badges and visual feedback

**Current Status**: ✅ Fully implemented
**Integration Points**:
- Calls `aiApi.ts` functions for processing
- Stores files in Supabase storage
- Updates document database records
- Triggers re-renders in DocumentLibrary

### DocumentLibrary.tsx
**Purpose**: Central document management with AI processing controls
**Key Features**:
- Tabular document listing with metadata
- Individual and bulk document processing
- AI server health status indicator
- Processing progress tracking
- Document classification display

**Current Status**: ✅ Implemented, needs CIM enhancement
**Pending Enhancements**:
- CIM detection logic for PDF files >15 pages
- "Process as CIM" button alongside standard processing
- CIM analysis results display
- CIM-specific status badges

### DealWorkspace.tsx
**Purpose**: Main workspace with tabbed interface for deal analysis
**Current Tabs**:
- **Documents**: File management and upload
- **Transcripts**: Audio transcription results
- **Excel Chunks**: Financial data visualization
- **Metrics**: Key performance indicators
- **Agent Query**: AI-powered Q&A (placeholder)
- **Memo Builder**: Investment memo generation (placeholder)

**Pending Addition**: CIM Analysis tab for investment-grade analysis

### Key Integration Points
```typescript
// AI API Integration Pattern
const processDocument = async (document: Document) => {
  const result = await processFile(file, dealId, documentId);
  if (result.success) {
    // Update UI state
    // Store results in database
    // Show success feedback
  }
};
```

## 🔄 Data Flow Architecture

### File Processing Workflow
1. **Upload**: `AIFileUpload` → Supabase Storage → Database record
2. **Detection**: File type detection → Processing method selection
3. **Processing**: `aiApi.ts` → AI Server → Structured results
4. **Storage**: Results → Supabase tables → Real-time UI updates
5. **Display**: Component re-renders → User sees analysis

### Database Integration
```typescript
// Core tables and their purposes
interface DatabaseSchema {
  deals: Deal[];              // Deal metadata and status
  documents: Document[];      // File storage references
  cim_analysis: CIMAnalysis[]; // Investment analysis results
  ai_outputs: AIOutput[];     // Raw AI processing results
  xlsx_chunks: ExcelChunk[];  // Financial data segments
  deal_metrics: Metric[];     // Extracted KPIs
  transcripts: Transcript[];  // Audio transcription results
}
```

## 🎯 Current Implementation Status

### ✅ Completed Components
- **Authentication**: Login/signup with Supabase Auth
- **Dashboard**: Deal overview with card-based layout
- **File Upload**: Multi-file drag & drop with progress tracking
- **Document Management**: Complete CRUD operations
- **AI Processing**: Integration with all backend endpoints
- **Real-time Updates**: Live processing status updates
- **Error Handling**: Comprehensive error states and user feedback

### 🚧 Pending CIM Integration
The following components need CIM-specific enhancements:

#### aiApi.ts Updates Needed
```typescript
// Add to existing file
export async function processCIM(
  file: File, 
  dealId: string, 
  documentId?: string
): Promise<AIResponse> {
  // Call /process-cim endpoint
  // Store results in cim_analysis table
  // Return structured CIM analysis
}
```

#### CIMAnalysisDisplay.tsx (New Component)
**Purpose**: Professional display of CIM analysis results
**Required Features**:
- Investment grade badge with color coding
- Financial metrics dashboard
- Risk assessment with severity indicators
- Investment highlights and recommendations
- Management questions for due diligence

#### DocumentLibrary.tsx Enhancements
**Required Updates**:
- PDF page count detection for CIM identification
- "Process as CIM" button for eligible documents
- CIM status badge for processed documents
- CIM analysis results modal/expansion

#### DealWorkspace.tsx Enhancement
**Required Addition**:
- New "CIM Analysis" tab
- Conditional display when CIM data exists
- Integration with CIMAnalysisDisplay component

## 🔗 AI Server Integration

### Current aiApi.ts Functions
```typescript
// Existing implemented functions
checkAIServerHealth(): Promise<boolean>
transcribeAudio(file: File, dealId: string): Promise<AIResponse>
processExcel(file: File, dealId: string): Promise<AIResponse>
processDocument(file: File, dealId: string): Promise<AIResponse>
processFile(file: File, dealId: string): Promise<AIResponse>
generateMemo(dealId: string): Promise<AIResponse>

// Pending implementation
processCIM(file: File, dealId: string): Promise<AIResponse> // ← Needs addition
```

### Database Storage Pattern
```typescript
// Standard pattern for storing AI results
async function storeProcessingResults(
  file: File,
  dealId: string,
  documentId: string,
  aiResponse: any,
  processingMethod: string
) {
  // Store in ai_outputs table
  // Store in method-specific table (cim_analysis, xlsx_chunks, etc.)
  // Extract and store metrics
  // Log processing activity
}
```

## 🎨 UI/UX Design Patterns

### Component Design System
- **Cards**: Primary container for all content sections
- **Badges**: Status indicators with semantic colors
- **Progress Bars**: Real-time processing feedback
- **Tables**: Document and data listing with actions
- **Tabs**: Workspace organization and navigation
- **Modals**: Detailed views and confirmations

### Color Coding System
```typescript
// Investment Grade Colors
const gradeColors = {
  'A+': 'bg-green-500',     // Excellent
  'A': 'bg-green-400',
  'B+': 'bg-yellow-400',    // Good
  'B': 'bg-yellow-300',
  'C': 'bg-orange-400',     // Caution
  'D': 'bg-red-400',        // Poor
  'F': 'bg-red-600'         // Fail
};

// Risk Severity Colors
const riskColors = {
  'High': 'bg-red-100 text-red-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'Low': 'bg-green-100 text-green-800'
};
```

## 🚀 Performance Optimizations

### React Query Integration
- **Server State**: All AI processing status and results
- **Caching**: Intelligent caching of document lists and analysis
- **Real-time**: Subscriptions for live processing updates
- **Error Handling**: Automatic retry logic for failed requests

### Lazy Loading
- **Route-based**: Code splitting for each major page
- **Component-based**: Heavy analysis components load on demand
- **File Processing**: Streaming results for large document processing

### State Management Strategy
```typescript
// Local state for UI interactions
const [selectedDocs, setSelectedDocs] = useState<Set<string>>();

// Server state for data persistence
const { data: documents, refetch } = useQuery(['documents', dealId], 
  () => fetchDocuments(dealId)
);

// Processing state for real-time updates
const { processFile, getProcessingStats } = useFileProcessing();
```

## 🔐 Security & Authentication

### Supabase Auth Integration
- **Protected Routes**: AuthLayout wrapper for authenticated pages
- **Row Level Security**: Database policies for user data isolation
- **File Access**: Secure storage with user-specific paths
- **API Security**: JWT tokens for backend communication

### Data Privacy
- **Document Storage**: User-specific folders in Supabase Storage
- **Processing Results**: User access controls on all analysis data
- **Audit Trail**: Complete logging of all document processing activities

## 📱 Responsive Design

### Mobile-First Approach
- **Tailwind CSS**: Mobile-first utility classes
- **Component Adaptation**: Responsive layouts for all screen sizes
- **Touch Optimization**: Mobile-friendly file upload and navigation
- **Performance**: Optimized bundle size for mobile networks

### Desktop Experience
- **Multi-column Layouts**: Efficient use of screen real estate
- **Keyboard Shortcuts**: Power user navigation and actions
- **Drag & Drop**: Enhanced file upload experience
- **Side-by-side Views**: Deal comparison and analysis workflows

## 🧪 Testing Strategy

### Component Testing
```typescript
// Example test structure for key components
describe('DocumentLibrary', () => {
  it('should detect CIM documents correctly');
  it('should show Process as CIM button for eligible PDFs');
  it('should handle bulk document processing');
  it('should display processing status accurately');
});

describe('CIMAnalysisDisplay', () => {
  it('should render investment grade with correct colors');
  it('should display financial metrics accurately');
  it('should show risk assessment with severity indicators');
});
```

### Integration Testing
- **AI API Integration**: Mock AI server responses for reliable testing
- **Database Operations**: Test Supabase CRUD operations
- **File Upload**: Test file processing workflows end-to-end
- **Authentication**: Test protected route access and permissions

## 🚀 Deployment & DevOps

### Lovable Platform Integration
- **Instant Deployment**: Every commit automatically deployed
- **Preview URLs**: Branch-based preview environments
- **Environment Variables**: Secure configuration management
- **Performance Monitoring**: Built-in analytics and error tracking

### Environment Configuration
```typescript
// Environment variables used
const config = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  VITE_AI_SERVER_URL: 'https://zxjyxzhoz0d2e5-8000.proxy.runpod.net'
};
```

## 📈 Performance Metrics

### Key Performance Indicators
- **First Load Time**: <3 seconds for dashboard
- **File Upload Speed**: Real-time progress feedback
- **AI Processing**: Visual progress for 30-60 second operations
- **Database Queries**: <500ms for most operations
- **Bundle Size**: <1MB total JavaScript bundle

### Optimization Techniques
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Automatic compression and formats
- **Caching Strategy**: Aggressive caching of AI results
- **Bundle Analysis**: Regular bundle size monitoring

## 🔄 State Management Patterns

### Local State (useState/useReducer)
```typescript
// UI state management
const [activeTab, setActiveTab] = useState('documents');
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
const [processingStatus, setProcessingStatus] = useState<ProcessingState>();
```

### Server State (React Query)
```typescript
// Data fetching and caching
const { data: deals } = useQuery(['deals'], fetchDeals);
const { data: documents } = useQuery(['documents', dealId], 
  () => fetchDocuments(dealId)
);
const { mutate: processDocument } = useMutation(processFile, {
  onSuccess: () => queryClient.invalidateQueries(['documents'])
});
```

### Global State (Context)
```typescript
// Authentication and user context
const AuthContext = createContext<{
  user: User | null;
  session: Session | null;
}>();
```

## 🎯 Next Development Priorities

### Immediate (Week 1)
1. **CIM Integration**: Complete frontend CIM processing workflow
2. **Component Creation**: Build CIMAnalysisDisplay component
3. **UI Enhancement**: Add CIM detection to DocumentLibrary
4. **Tab Integration**: Add CIM Analysis tab to DealWorkspace

### Short-term (Month 1)
1. **Investment Memos**: Professional PDF export functionality
2. **Deal Comparison**: Side-by-side analysis interface
3. **Advanced Analytics**: Enhanced financial visualization
4. **User Onboarding**: Guided tour and help system

### Medium-term (Quarter 1)
1. **Multi-tenant Support**: Organization-level access controls
2. **API Development**: External API for third-party integration
3. **Advanced AI**: Custom model fine-tuning interface
4. **Enterprise Features**: Advanced security and compliance tools

## 🐛 Known Issues & Technical Debt

### Current Limitations
1. **File Size Limits**: Large PDF processing can timeout
2. **Error Recovery**: Limited retry logic for failed AI processing
3. **Offline Support**: No offline document viewing capabilities
4. **Mobile UX**: File upload experience needs mobile optimization

### Technical Debt
1. **Component Splitting**: Some components are too large (DocumentLibrary)
2. **Type Safety**: Some `any` types need proper interfaces
3. **Error Boundaries**: Need better error isolation
4. **Testing Coverage**: Need more comprehensive test suite

## 🔧 Development Guidelines

### Code Standards
```typescript
// Component structure
interface ComponentProps {
  // Required props first
  dealId: string;
  // Optional props with defaults
  maxFiles?: number;
  className?: string;
}

export function Component({ 
  dealId, 
  maxFiles = 10, 
  className 
}: ComponentProps) {
  // Hooks at top
  const [state, setState] = useState();
  const { data } = useQuery();
  
  // Event handlers
  const handleAction = useCallback(() => {}, []);
  
  // Render
  return <div className={cn('base-styles', className)} />;
}
```

### File Organization
- **One component per file**: Clear file structure
- **Barrel exports**: Clean import statements
- **Type colocation**: Types near their usage
- **Utility separation**: Pure functions in utils/

### Git Workflow
- **Feature branches**: One feature per branch
- **Descriptive commits**: Clear commit messages
- **Pull requests**: Code review for all changes
- **Automated deployment**: Lovable handles deployment

This architecture provides a solid foundation for the CIM processing integration and future enhancements while maintaining code quality and user experience standards.