# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Technician Dispatch Management** system backed by a PostgreSQL database (`TechnicianDispatch`). The project is in early setup — source code has not yet been added. Expand this file as the codebase grows.

## Database Access

A PostgreSQL MCP server is configured in `.mcp.json` and enabled in `.claude/settings.local.json`. You can query the database directly using the `mcp__postgres__query` tool (read-only).

- **Database**: `TechnicianDispatch`
- **Host**: `localhost:5432`
- **User**: `TechDispatchUser`

Use `mcp__postgres__query` to inspect the schema, explore tables, or answer questions about data structure before writing code.

## Architecture

> To be expanded once source code is added.
