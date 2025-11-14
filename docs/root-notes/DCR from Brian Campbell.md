


Brian Campbell can comment further but there's growing recognition that DCR is not going to work for Personal Agents.  See https://blog.modelcontextprotocol.io/posts/client_registration/
This has been proposed as an alternative: https://www.ietf.org/archive/id/draft-parecki-oauth-client-id-metadata-document-03.html
For Digital Assistants, we need to get here: https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/, which builds on top of all of @bcampbell's efforts (specifically Token Exchange, JWT Profile for OAuth 2.0 Authorization Grant and this one: https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/)
mcp blog
https://blog.modelcontextprotocol.io/posts/client_registration/
Evolving OAuth Client Registration in the Model Context Protocol
The Model Context Protocol (MCP) has adopted OAuth 2.1 as the foundation for its authorization framework. A key part of the authorization flow that MCP is particularly reliant on is client registration.
This is especially important in a world where clients and servers don’t have a pre-existing relationship - we can’t assume that we will always know which MCP clients will connect to which MCP servers. This design highlights two challenges that need to be addressed:

ietf.org
OAuth Client ID Metadata Document
https://www.ietf.org/archive/id/draft-parecki-oauth-client-id-metadata-document-03.html
This specification defines a mechanism through which an OAuth client can
identify itself to authorization servers, without prior dynamic client
registration or other existing registration. This is through the usage of a URL
as a client_id in an OAuth flow, where the URL refers to a document containing
the necessary client metadata, enabling the authorization server to fetch the
Show more
IETF DatatrackerIETF Datatracker
https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/
Identity Assertion Authorization Grant
This specification provides a mechanism for an application to use an identity assertion to obtain an access token for a third-party API by coordinating through a common enterprise identity provider using Token Exchange [RFC8693] and JWT Profile for OAuth 2.0 Authorization Grants [RFC7523].
https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/

IETF DatatrackerIETF Datatracker
OAuth Identity and Authorization Chaining Across Domains
This specification defines a mechanism to preserve identity and authorization information across trust domains that use the OAuth 2.0 Framework. Discussion Venues This note is to be removed before publishing as an RFC. Discussion of this document takes place on the Web Authorization Protocol Working Group mailing list (oauth@ietf.org), which is archived at https://mailarchive.ietf.org/arch/browse/oauth/. Source for this draft and an issue tracker can be found at https://github.com/oauth-wg/oauth-identity-chaining.






Thanks @Adam Rusbridge for saying a lot of what I'd have said. One minor update is that CIMD is a recently adopted work item of the IETF OAuth WG, which is just one step in the bigger process but an important milestone and indication of community's interest in the work. https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document is a version fluid pointer to that more official work. And, from what I understand, the enhancement proposal to include CIMD in MCP is being considered seriously https://github.com/modelcontextprotocol/modelcontextprotocol/issues/991




I also spent some time with some P1 multi-tenant PM and engineering folks recently discussing supporting token exchange in the context of that Identity Assertion Authorization Grant work, which seems to be gaining importance in AI agents in the enterprise cases. (edited) 


Brian Campbell
  Yesterday at 7:13 PM
you might also hear ID-JAG or Cross-App Access as terms for the Identity Assertion Authorization Grant draft.
(https://docs.google.com/document/d/14FGg98Gng2Jne2_kctdpcWU_CFULhmjAn-fY3tu0ssI/edit?tab=t.0#heading=h.igzso6n0gtjb)
Cross-App Access and MCP Enterprise Identity Integration is a short thing I wrote somewhat recently that tries to give a little more context about it