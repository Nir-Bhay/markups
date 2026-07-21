# Markups API Specification

## Overview
The API will expose document management, authentication, collaboration, version history, search, AI services and plugin endpoints.

## Authentication
- POST /auth/signup
- POST /auth/login
- POST /auth/logout
- GET /auth/me

## Documents
- GET /documents
- POST /documents
- GET /documents/{id}
- PATCH /documents/{id}
- DELETE /documents/{id}

## Sharing
- POST /documents/{id}/share
- GET /share/{token}
- PATCH /share/{token}
- DELETE /share/{token}

## Collaboration
- WebSocket endpoint
- Presence
- Cursor positions
- CRDT operations

## Version History
- GET /documents/{id}/versions
- POST /documents/{id}/restore/{version}

## AI
- POST /ai/complete
- POST /ai/summarize
- POST /ai/rewrite
- POST /ai/chat

## Plugins
- GET /plugins
- POST /plugins/install
- DELETE /plugins/{id}

## Future
This document will be expanded with request/response schemas, authentication flows, OpenAPI examples, rate limits, error codes and SDK documentation.