"""
title: Searchcraft MCP Pipeline
author: Searchcraft Team
version: 1.0.0
license: Apache-2.0
description: A pipeline that integrates Searchcraft MCP server with Open WebUI
requirements: requests
"""

import requests
import json
from typing import List, Union, Generator, Iterator
from pydantic import BaseModel


class Pipeline:
    class Valves(BaseModel):
        MCP_SERVER_URL: str = "http://localhost:3100/mcp"
        ENDPOINT_URL: str = ""
        ADMIN_KEY: str = ""
        ENABLE_MCP_TOOLS: bool = True

    def __init__(self):
        self.name = "Searchcraft MCP Pipeline"
        self.valves = self.Valves()
        self.mcp_session_id = None

    async def on_startup(self):
        print(f"on_startup:{__name__}")
        # Initialize MCP connection
        await self._initialize_mcp()

    async def on_shutdown(self):
        print(f"on_shutdown:{__name__}")

    async def _initialize_mcp(self):
        """Initialize MCP session with the Searchcraft server"""
        try:
            init_payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2025-06-18",
                    "capabilities": {},
                    "clientInfo": {"name": "open-webui-pipeline", "version": "1.0.0"}
                }
            }
            
            response = requests.post(self.valves.MCP_SERVER_URL, json=init_payload, timeout=10)
            
            if response.status_code == 200:
                print("✅ MCP connection established with Searchcraft server")
                return True
            else:
                print(f"❌ MCP connection failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ MCP connection error: {e}")
            return False

    def _get_available_tools(self):
        """Get list of available MCP tools from Searchcraft server"""
        try:
            tools_payload = {
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/list"
            }
            
            response = requests.post(self.valves.MCP_SERVER_URL, json=tools_payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "result" in data and "tools" in data["result"]:
                    return [tool["name"] for tool in data["result"]["tools"]]
            
            return []
            
        except Exception as e:
            print(f"Error getting MCP tools: {e}")
            return []

    def _enhance_message_with_context(self, user_message: str) -> str:
        """Enhance user message with Searchcraft MCP context"""
        
        # Check if message contains Searchcraft-related keywords
        searchcraft_keywords = [
            'search', 'index', 'document', 'searchcraft', 'federation', 
            'key', 'authentication', 'stopwords', 'synonyms', 'analytics'
        ]
        
        if any(keyword in user_message.lower() for keyword in searchcraft_keywords):
            tools = self._get_available_tools()
            
            if tools:
                tools_context = f"""
[🛰️ Searchcraft MCP Tools Available: {', '.join(tools[:10])}{'...' if len(tools) > 10 else ''}]

Available Searchcraft operations:
• Index Management: create_index, delete_index, list_all_indexes, get_index_stats
• Document Operations: add_documents, delete_documents, get_document_by_id
• Search & Analytics: get_search_results, get_measure_summary
• Authentication: create_key, delete_key, list_all_keys
• Federation: create_federation, delete_federation, list_all_federations
• And 20+ more tools for comprehensive cluster management

"""
                return tools_context + user_message
        
        return user_message

    def pipe(
        self, user_message: str, model_id: str, messages: List[dict], body: dict
    ) -> Union[str, Generator, Iterator]:
        """
        Main pipeline function that processes messages through Searchcraft MCP integration
        """
        
        if not self.valves.ENABLE_MCP_TOOLS:
            return user_message
            
        # Enhance message with Searchcraft context if relevant
        enhanced_message = self._enhance_message_with_context(user_message)
        
        # Add system context about Searchcraft capabilities
        if enhanced_message != user_message:
            system_context = """
You have access to Searchcraft MCP tools for managing search clusters. When users ask about:
- Creating or managing search indexes
- Adding or searching documents  
- Setting up authentication keys
- Configuring federations
- Analyzing search performance

You can help them accomplish these tasks using the available Searchcraft MCP tools.
"""
            
            # Add system context to the conversation
            if messages and messages[0].get("role") == "system":
                messages[0]["content"] += system_context
            else:
                messages.insert(0, {"role": "system", "content": system_context})
        
        return enhanced_message
