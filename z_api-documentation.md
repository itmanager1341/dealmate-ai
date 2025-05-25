
# DealMate AI - API Documentation

## Base URL
```
https://zxjyxzhoz0d2e5-8000.proxy.runpod.net
```

## Authentication
- No authentication required for AI processing endpoints
- Frontend handles user authentication via Supabase
- All requests should include proper CORS headers

## Health & Status

### GET /
**Purpose**: Server information and available endpoints
**Response**:
```json
{
  "service": "DealMate AI Agent Server",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2025-05-24T19:19:16.000Z",
  "endpoints": {
    "health": "/health",
    "transcribe": "/transcribe (POST)",
    "process_excel": "/process-excel (POST)",
    "process_document": "/process-document (POST)",
    "process_cim": "/process-cim (POST)",
    "generate_memo": "/generate-memo (POST)"
  }
}
```

### GET /health
**Purpose**: Health check for server status
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-05-24T19:19:16.000Z",
  "services": {
    "openai": "configured",
    "whisper": "ready"
  }
}
```

## Document Processing Endpoints

### POST /process-cim
**Purpose**: Process CIM documents with specialized investment analysis
**Status**: 🔄 **In Testing Phase** - Core functionality working, JSON parsing optimization in progress

**Request**:
- **Content-Type**: `multipart/form-data`
- **file**: PDF file (CIM document)
- **deal_id**: String identifier for the deal

**Response**:
```json
{
  "success": true,
  "deal_id": "deal-123",
  "filename": "project-leap-cim.pdf",
  "document_type": "CIM",
  "page_count": 22,
  "text_length": 15847,
  "ai_analysis": "{\"investment_grade\": \"B+\", \"executive_summary\": \"...\", \"financial_metrics\": {...}}",
  "processing_time": "completed",
  "analysis_type": "comprehensive_cim"
}
```

**AI Analysis Structure**:
```json
{
  "investment_grade": "A+/A/A-/B+/B/B-/C+/C/C-/D+/D/F",
  "executive_summary": "Brief overview",
  "business_model": {
    "type": "Business model description",
    "revenue_streams": ["stream1", "stream2"],
    "key_value_propositions": ["prop1", "prop2"]
  },
  "financial_metrics": {
    "revenue_cagr": "X.X%",
    "ebitda_margin": "X.X%",
    "deal_size_estimate": "$XXM",
    "revenue_multiple": "X.Xx",
    "ebitda_multiple": "X.Xx"
  },
  "key_risks": [
    {
      "risk": "Risk description",
      "severity": "High/Medium/Low",
      "impact": "Impact description"
    }
  ],
  "investment_highlights": ["highlight1", "highlight2"],
  "management_questions": ["question1", "question2"],
  "competitive_position": {
    "strengths": ["strength1"],
    "weaknesses": ["weakness1"],
    "market_position": "Position description"
  },
  "recommendation": {
    "action": "Pursue/Pass/More Info Needed",
    "rationale": "Reasoning"
  }
}
```

### POST /process-excel
**Purpose**: Extract financial metrics from Excel files
**Status**: ✅ Working

**Request**:
- **Content-Type**: `multipart/form-data`
- **file**: Excel file (.xlsx, .xls)
- **deal_id**: String identifier

**Response**:
```json
{
  "success": true,
  "deal_id": "deal-123",
  "filename": "financials.xlsx",
  "sheets": ["Sheet1", "Revenue", "P&L"],
  "ai_analysis": "Structured financial analysis...",
  "raw_data_preview": "First 500 chars of data..."
}
```

### POST /process-document
**Purpose**: Analyze PDF/Word documents for business insights
**Status**: ✅ Working

**Request**:
- **Content-Type**: `multipart/form-data`
- **file**: Document file (.pdf, .docx, .doc)
- **deal_id**: String identifier

**Response**:
```json
{
  "success": true,
  "deal_id": "deal-123",
  "filename": "business-plan.pdf",
  "text_length": 8542,
  "ai_analysis": "Business analysis with insights...",
  "text_preview": "First 500 chars..."
}
```

### POST /transcribe
**Purpose**: Transcribe audio files using Whisper
**Status**: ✅ Working

**Request**:
- **Content-Type**: `multipart/form-data`
- **file**: Audio file (.mp3, .wav, .m4a)
- **deal_id**: String identifier

**Response**:
```json
{
  "success": true,
  "deal_id": "deal-123",
  "filename": "meeting.mp3",
  "transcription": "Full transcription text...",
  "segments": [
    {
      "start": 0.0,
      "end": 5.2,
      "text": "Welcome to the meeting..."
    }
  ],
  "processing_time": 12.5
}
```

### POST /generate-memo
**Purpose**: Generate investment memo from processed data
**Status**: ✅ Basic Implementation

**Request**:
```json
{
  "deal_id": "deal-123",
  "sections": ["executive_summary", "financial_analysis", "risks", "recommendation"]
}
```

**Response**:
```json
{
  "success": true,
  "deal_id": "deal-123",
  "memo": "Professional investment memo content...",
  "sections": ["executive_summary", "financial_analysis", "risks", "recommendation"],
  "generated_at": "2025-05-24T19:19:16.000Z"
}
```

## Progress Tracking

### CIM Processing Progress States
The frontend implements real-time progress tracking for CIM analysis:

**Progress Steps**:
1. **Validation** (0-25%): File type and size validation
2. **Analysis** (25-75%): AI processing and analysis generation
3. **Storage** (75-95%): Database storage and indexing
4. **Complete** (100%): Processing finished successfully

**Progress Response Format**:
```json
{
  "step": "analysis",
  "progress": 45,
  "message": "AI analyzing document structure..."
}
```

## Enhanced Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error description",
  "error_code": "CIM_PARSE_ERROR",
  "retry_suggested": true,
  "fallback_available": true
}
```

### CIM-Specific Error Scenarios

#### JSON Parsing Failures
**Issue**: AI response not properly formatted as JSON
**Frontend Handling**: 
- Multiple parsing strategies (direct JSON, markdown extraction, fallback structure)
- Graceful degradation with partial analysis display
- User notification with option to retry

**Error Response**:
```json
{
  "success": false,
  "error": "Analysis parsing failed - fallback structure created",
  "error_code": "JSON_PARSE_FALLBACK",
  "raw_response": "AI analysis text...",
  "fallback_analysis": {...}
}
```

#### File Validation Errors
**Common Issues**:
- File size too large (>50MB)
- File size too small (<1MB for CIM)
- Invalid file format (non-PDF)
- Corrupted or encrypted PDF

**Error Response**:
```json
{
  "success": false,
  "error": "File validation failed",
  "error_code": "VALIDATION_ERROR",
  "validation_details": {
    "file_size": "25MB",
    "file_type": "application/pdf",
    "confidence": 65,
    "issues": ["File appears too small for comprehensive CIM"]
  }
}
```

### Error Recovery Strategies

#### Automatic Retry Logic
- **Network timeouts**: 3 automatic retries with exponential backoff
- **Server errors (5xx)**: 2 retries with 5-second delay
- **Rate limiting**: Intelligent backoff based on response headers

#### Graceful Degradation
- **Partial parsing success**: Display available data with warnings
- **Fallback analysis**: Create basic structure from raw text when JSON parsing fails
- **Progressive enhancement**: Load components as data becomes available

## Frontend Integration

### CIM Processing Components

#### CIMProcessingProgress
**Purpose**: Real-time visual feedback during CIM analysis
**Features**:
- Step-by-step progress visualization
- Error state handling with detailed messages
- Processing time estimation
- Animated status indicators

#### Enhanced File Upload
**CIM Detection**:
- Filename keyword analysis (confidence scoring)
- File size validation (1MB-50MB range)
- Automatic CIM suggestion for qualifying PDFs
- Preview of processing method before upload

#### Error Display
**User-Friendly Messages**:
- Plain English error descriptions
- Suggested actions for common issues
- Retry buttons with smart logic
- Contact support for persistent failures

### Database Integration Patterns

#### CIM Analysis Storage
```sql
-- Primary CIM analysis table
cim_analysis {
  deal_id: uuid,
  document_id: uuid,
  investment_grade: text,
  executive_summary: text,
  business_model: jsonb,
  financial_metrics: jsonb,
  key_risks: jsonb[],
  investment_highlights: text[],
  management_questions: text[],
  competitive_position: jsonb,
  recommendation: jsonb,
  raw_ai_response: jsonb
}

-- Audit trail
ai_outputs {
  deal_id: uuid,
  document_id: uuid,
  agent_type: 'cim_analysis',
  output_type: 'investment_analysis',
  output_json: jsonb,
  created_at: timestamp
}
```

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. CIM Processing Timeout
**Symptoms**: Request times out after 60+ seconds
**Causes**: 
- Large document size (>20MB)
- Complex document structure
- Server overload during peak usage

**Solutions**:
```javascript
// Implement timeout handling
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Processing timeout')), 90000)
);

const processingPromise = processCIM(file, dealId);
const result = await Promise.race([processingPromise, timeoutPromise]);
```

#### 2. JSON Parsing Errors
**Symptoms**: Analysis data appears as raw text instead of structured format
**Debugging Steps**:
1. Check `raw_ai_response` field in database
2. Verify AI response format in server logs
3. Test parsing strategies in isolation

**Frontend Fallback**:
```javascript
// Multiple parsing strategies implemented
function parseAIAnalysisWithFallback(text) {
  // Strategy 1: Direct JSON
  // Strategy 2: Markdown code blocks
  // Strategy 3: Brace extraction
  // Strategy 4: Fallback structure
}
```

#### 3. File Upload Validation Failures
**Common Issues**:
- CORS headers missing
- File size limits exceeded
- Unsupported file formats

**Validation Implementation**:
```javascript
function validateCIMFile(file) {
  // Size validation (1MB-50MB)
  // Type validation (PDF only)
  // Keyword confidence scoring
  // Return detailed validation result
}
```

#### 4. Database Storage Errors
**Symptoms**: Processing succeeds but data not saved
**Debugging**:
- Check Supabase connection status
- Verify table permissions (RLS policies)
- Monitor database logs for constraint violations

### Performance Optimization

#### Processing Time Benchmarks
- **Small CIM (<5MB)**: 30-45 seconds
- **Medium CIM (5-15MB)**: 45-75 seconds  
- **Large CIM (15-50MB)**: 75-120 seconds
- **Excel Files**: 10-30 seconds
- **Audio Files**: 1-2x real-time duration

#### Memory Management
- **Document chunking**: Large files processed in segments
- **Result streaming**: Progressive data loading
- **Cache optimization**: Frequently accessed data cached client-side

### Monitoring & Alerts

#### Health Check Schedule
```javascript
// Recommended monitoring frequency
const healthChecks = {
  server_status: '1 minute',
  endpoint_availability: '5 minutes',
  processing_performance: '15 minutes',
  error_rate_monitoring: 'continuous'
};
```

#### Key Metrics to Track
- **Success Rate**: >95% for all processing types
- **Average Processing Time**: Within benchmark ranges
- **Error Rate**: <5% overall, <2% for critical errors
- **User Satisfaction**: Completion rate and retry patterns

## Development Status

### Current Phase: Testing & Refinement
**Focus Areas**:
- JSON parsing reliability improvements
- Error handling robustness
- User experience optimization
- Performance benchmarking

**Known Issues**:
- Occasional JSON parsing failures requiring fallback strategies
- Processing time variability based on document complexity
- Server timeout handling needs optimization

**Upcoming Improvements**:
- Enhanced AI prompt engineering for consistent JSON output
- Intelligent document pre-processing
- Advanced retry logic with adaptive timeouts
- Real-time processing status WebSocket integration

### Quality Assurance

#### Testing Coverage
- **Unit Tests**: Core parsing and validation functions
- **Integration Tests**: End-to-end processing workflows
- **Load Testing**: Concurrent processing capabilities
- **User Acceptance Testing**: Real-world CIM document processing

#### Performance Testing
- **Baseline Performance**: Established for all document types
- **Stress Testing**: Multiple concurrent uploads
- **Memory Profiling**: Optimization for large documents
- **Network Resilience**: Handling of poor connectivity

## Security & Compliance

### Data Protection
- **File Encryption**: Documents encrypted at rest and in transit
- **Access Control**: User-specific document isolation
- **Audit Logging**: Complete processing history maintained
- **Data Retention**: Configurable retention policies

### API Security
- **Rate Limiting**: Per-user and global limits
- **Input Validation**: Comprehensive file and parameter validation
- **Error Sanitization**: No sensitive data exposed in error messages
- **CORS Configuration**: Secure cross-origin request handling

## Support & Maintenance

### Error Reporting
- **Automatic Logging**: All errors logged with context
- **User Feedback**: In-app error reporting system
- **Performance Monitoring**: Real-time metrics dashboard
- **Alert System**: Proactive issue detection

### API Versioning
- **Current Version**: 1.0.0 (stable)
- **Backward Compatibility**: Maintained for all endpoints
- **Deprecation Policy**: 6-month notice for breaking changes
- **Migration Support**: Automated migration tools available

---

**Last Updated**: 2025-05-25  
**Documentation Version**: 2.0.0  
**API Version**: 1.0.0  
**Status**: Production Ready (Testing Phase)
