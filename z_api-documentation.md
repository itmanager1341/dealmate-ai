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
**Status**: ✅ Implemented and Tested

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

## Error Responses

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Error description"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (missing file, invalid parameters)
- `405` - Method Not Allowed (wrong HTTP method)
- `500` - Internal Server Error (processing failure)

## Technical Implementation

### AI Models Used
- **Primary**: GPT-4 for CIM analysis (sophisticated investment insights)
- **Fallback**: GPT-3.5-turbo for reliability and cost efficiency
- **Audio**: Whisper base model (pre-loaded for performance)

### File Processing Limits
- **CIM Analysis**: 20,000 characters for comprehensive review
- **General Documents**: 4,000 characters for standard analysis
- **Excel Files**: First 10 rows per sheet for performance
- **Audio**: No built-in limits (depends on Whisper model)

### Performance Characteristics
- **CIM Processing**: 30-60 seconds (depends on document size)
- **Excel Analysis**: 10-30 seconds
- **Document Analysis**: 15-45 seconds
- **Audio Transcription**: ~1-2x real-time (5 min audio = 5-10 min processing)

### Dependencies
- **Flask**: Web framework with CORS enabled
- **OpenAI**: GPT models and API integration
- **Whisper**: Local audio transcription
- **PyPDF2**: PDF text extraction
- **pandas**: Excel file processing
- **python-docx**: Word document processing

## Integration Notes

### Frontend Integration
- All endpoints expect `multipart/form-data` for file uploads
- Include `deal_id` parameter for database integration
- Handle both success and error responses appropriately
- Implement timeout handling (processing can take 30-60 seconds)

### Database Storage
- Frontend should store AI responses in appropriate Supabase tables
- CIM analysis → `cim_analysis` table
- General outputs → `ai_outputs` table
- Metrics extraction → `deal_metrics` table
- Audio transcription → `transcripts` table

### Error Handling
- Network timeouts: Implement 60+ second timeouts
- Server errors: Graceful fallback and user feedback
- File format validation: Check file types before upload
- Processing failures: Retry logic for transient errors

## Development & Testing

### Local Testing
```bash
# Test health endpoint
curl https://zxjyxzhoz0d2e5-8000.proxy.runpod.net/health

# Test CIM processing
curl -X POST \
  -F "file=@path/to/cim.pdf" \
  -F "deal_id=test-deal-123" \
  https://zxjyxzhoz0d2e5-8000.proxy.runpod.net/process-cim
```

### Monitoring
- Health checks every 5 minutes recommended
- Monitor processing times and error rates
- Log all API calls for debugging and optimization
- Track GPU usage on RunPod for cost optimization