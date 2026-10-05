export interface paths {
    "/audit-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Audit Logs
         * @description Returns a paginated list of audit log entries scoped to the authenticated principal.
         *
         *     Workspace-scoped sessions and API tokens see only their workspace; org admins and API tokens scoped to `all_workspaces_in_org` see every workspace in their organization.
         *
         *     Sorted by `timestamp` descending. Use the returned `next_cursor` (when present) as the `cursor` query parameter on the next request to continue paging.
         */
        get: operations["auditLogs-publicList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attack_paths": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Attack Paths
         * @description Retrieves all attack paths discovered within a workspace. Attack path is a condition in which an asset is both externally exploitable and has a cloud blast radius that allows it to potentially interact with or compromise internal resources.
         *
         *     Each response entry includes the attack path ID, severity, associated finding types, and violations count.
         *
         *     Use this endpoint to review all known attack paths, track exposed resources, and prioritize remediation efforts across the environment.
         */
        get: operations["attackPaths-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attack_paths/violations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Attack Path Violations
         * @description Retrieves all resources that are violating security posture rules and, as a result, create an attack path condition.
         *
         *     An attack path occurs when an asset is both externally exploitable and has a cloud blast radius that allows it to potentially interact with or compromise internal resources.
         *
         *     The response includes the resource IDs along with the timestamps indicating when each resource began violating the rule.
         */
        get: operations["attackPaths-violations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attack_paths/details/{resource_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Resource Attack Path Details
         * @description Retrieves the complete attack path for a specified resource, showing the sequence of network and security components an attacker could traverse to reach it.
         *
         *     The response returns one or more ordered paths, starting from the origin (e.g., Internet) and listing each intermediate element such as gateways, ACLs, security groups, load balancers, or other relevant resources.
         *
         *     Parameters include the unique resource_id (required) and the optional workspace context.
         *
         *     Use this endpoint to visualize potential exposure, assess lateral movement risk, and prioritize remediation actions.
         */
        get: operations["attackPaths-details"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/canaries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Canaries
         * @description Retrieves a list of all deployed and configured canary resources across monitored accounts.
         *
         *     A canary resource is a controlled, decoy asset - such as an S3 bucket - used to detect unauthorized activity by triggering alerts when predefined detection actions occur.
         *
         *     This endpoint supports filtering by account ID, region, resource type, status, creator, and other attributes. Optional parameters allow inclusion of related activity logs for each canary.
         *
         *     Returned objects include canary metadata, deployment status, detection settings, exclusion rules, and recent activity indicators.
         */
        get: operations["canaries-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config-changes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Configuration Changes
         * @description Retrieves recent configuration changes -write audit events analyzed for security impact, such as internet exposure, privilege escalation, or new database access.
         *
         *     The response includes what was changed, its severity and time, affected resources, related user and network details, along with any linked events and raw data.
         *
         *     Use this endpoint to investigate recent changes to understand their security implications and identify potential risks.
         */
        get: operations["configChanges-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config-changes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Configuration Change Details
         * @description Retrieves the full details of a specific configuration change by its unique ID, including associated violations and attack paths.
         *
         *     Configuration changes are write audit events analyzed for security impact, such as internet exposure, privilege escalation, or new database access.
         *
         *     Use this endpoint to investigate the change, assess its risk, and understand potential exploitation paths.
         */
        get: operations["configChanges-details"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Resources
         * @description Retrieves cloud and platform resources across monitored environments, returning normalized metadata such as resource ID, type, display name, account ID, region, cloud provider, parent lineage, public accessibility status, and end timestamp.
         *
         *     This endpoint is useful for building an inventory, performing lookups, and pivoting between related assets.
         */
        get: operations["inventory-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/resource": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Resource Details
         * @description Retrieves detailed metadata and configuration for a specific resource, including its type, display name, cloud provider, account, region, accessibility status, tags, and associated network interfaces.
         *
         *     The response also includes translated and enriched data such as cluster or namespace context, container specifications, environment variables, volume mounts, owner references, conditions, and node selectors. Depending on the resource type, additional attributes like security settings, probes, and connected services may be included.
         *
         *     Use this endpoint to obtain a comprehensive view of a resource’s identity, configuration, and operational state for inventory, compliance, or investigation purposes.
         */
        get: operations["inventory-details"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/resource/configuration": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Resource Configuration
         * @description Retrieves the translated configuration data for a specific resource by its ID.
         *
         *     The translated data contains enriched and normalized resource attributes, which vary depending on the resource type and cloud provider. This may include identity details, networking, tags, hierarchical context, and provider-specific settings.
         *
         *     Use this endpoint to obtain a resource’s processed configuration for inventory browsing, compliance review, or investigation purposes.
         */
        get: operations["inventory-configuration"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/resource/raw-configuration": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Raw Resource Configuration
         * @description Retrieves the raw, unprocessed provider configuration for a specific resource by its ID.
         *
         *     This is the verbatim payload as returned by the cloud provider and is larger than the translated view. Use /inventory/resource/configuration for enriched, normalized attributes.
         */
        get: operations["inventory-rawConfiguration"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Resource Inventory Summary
         * @description Returns a summary of resources grouped by type, including the count of each resource type across the environment.
         *
         *     Use this endpoint to quickly assess resource distribution and identify concentration areas across your environment.
         */
        get: operations["inventory-type"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/crown_jewels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Crown Jewels
         * @description Validates whether the specified resources are marked as  as crown jewels — high-value or business-critical assets.
         *
         *     If none of the provided resources are marked as crown jewels, the response will be empty.
         *
         *     Use this endpoint to programmatically verify the crown jewel status of specific resources across your environment.
         */
        get: operations["inventory-crownJewels"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/resource-types/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Resolve a fuzzy resource-type string to canonical names
         * @description Takes a free-form resource-type string (e.g. "eks_cluster", "ec2 instance", "s3", "kubernetes pod") and returns the closest matching canonical resource type names supported by inventory.
         *
         *     Match order: (1) exact, (2) curated alias map for common LLM guesses, (3) substring on canonical name, (4) all-tokens-present fuzzy match.
         *
         *     Use this BEFORE calling inventory__list with a guessed resource_type to avoid the "Invalid resource type" error round-trip.
         */
        get: operations["inventory-resolveResourceType"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/investigate/resource/{resourceId}/data": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Resource Investigator Data
         * @description Retrieves detailed investigative data for a specified resource within a given time range. This endpoint is intended for resource-focused investigations, providing activity and network context to assess potential compromise or misuse.
         *
         *     The response includes identity logs showing actions performed by principals (with source IP, identity details, destinations, error codes, and activity counts), process logs for commands executed on the resource (including parent binary, arguments, container, last seen time, and execution count), and flow logs describing network connections to other services, endpoints, or the internet (with traffic volume, destination details, and DNS names).
         *
         *     This endpoint is used to conduct in-depth investigations into a resource’s activity and connections.
         */
        get: operations["investigator-investigate"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/investigate/resource/{resourceId}/ai_summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Resource AI Investigation Summary
         * @description Performs an AI-driven investigation of a resource’s activity within a specified time range and returns a concise summary. The analysis provides a verdict, confidence score, and contextual reasoning, highlighting whether the behavior appears benign, suspicious, or malicious, and why.
         *
         *     Use this endpoint to rapidly assess a resource’s activity through AI investigation.
         */
        get: operations["investigator-summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/investigate/process-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get Process Execution Logs
         * @description Query aggregated process execution logs for a resource. Returns processes run on endpoints including parent process, binary path, arguments, container, and execution count. Use to investigate suspicious process activity, lateral movement, or malware execution.
         *
         *     SCOPING: this endpoint AGGREGATES across every monitored resource unless you narrow it. Pass `resource_id` (or `pod_name` together with `namespace`) whenever the question is about ONE resource. The counts returned are sums over whatever the filter matched, so an unscoped call can show that something happened in the environment but NOT that a particular resource did it — each result row names its own container/namespace/account, and that is what its number belongs to. Never attribute a count from an unscoped call to a specific resource: re-run it scoped first.
         */
        post: operations["investigator-processLogs"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/investigate/file-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get File Access Logs
         * @description Query aggregated file access logs for a resource. Returns file operations including process that accessed the file, file path, operation type (read/write/create/delete), container, and access count. Use to investigate data exfiltration, unauthorized file modifications, or malware file drops.
         *
         *     SCOPING: this endpoint AGGREGATES across every monitored resource unless you narrow it. Pass `resource_id` (or `pod_name` together with `namespace`) whenever the question is about ONE resource. The counts returned are sums over whatever the filter matched, so an unscoped call can show that something happened in the environment but NOT that a particular resource did it — each result row names its own container/namespace/account, and that is what its number belongs to. Never attribute a count from an unscoped call to a specific resource: re-run it scoped first.
         */
        post: operations["investigator-fileLogs"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/investigate/api-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get API Call Logs
         * @description Query aggregated API call logs for a resource. Returns HTTP requests made by or to the resource including method, host, path, direction (inbound/outbound), destination, and call count. Use to investigate unauthorized API access, data exfiltration via HTTP, or communication with suspicious external services.
         *
         *     SCOPING: this endpoint AGGREGATES across every monitored resource unless you narrow it. Pass `resource_id` (or `pod_name` together with `namespace`) whenever the question is about ONE resource. The counts returned are sums over whatever the filter matched, so an unscoped call can show that something happened in the environment but NOT that a particular resource did it — each result row names its own container/namespace/account, and that is what its number belongs to. Never attribute a count from an unscoped call to a specific resource: re-run it scoped first.
         */
        post: operations["investigator-apiLogs"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/integrations/kubernetes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Integrated K8s Clusters
         * @description Retrieves a list of Kubernetes clusters integrated with the platform, along with their connection status, agent types, runtime agent reporting metrics, version, and last seen timestamp.
         *
         *     Each cluster entry includes its display name, cloud provider, account, connection state, number of reporting runtime agents, and platform version.
         *
         *     Use this endpoint to monitor the health and status of all integrated Kubernetes clusters across environments.
         *
         *     Supports pagination with skip and limit parameters.
         */
        get: operations["integrations-kubernetes-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/integrations/ecs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Integrated ECS Clusters
         * @description Retrieves a list of ECS clusters integrated with the platform, along with their connection status, agent types, runtime agent reporting metrics, version, and last seen timestamp.
         *
         *     Each cluster entry includes its display name, cloud provider, account, connection state, number of reporting runtime agents, and platform version.
         *
         *     Use this endpoint to monitor the health and status of all integrated ECS clusters across environments.
         */
        get: operations["integrations-ecs-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/log-query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Query logs (hot/cold routed)
         * @description Runs a structured log query, routing to OpenSearch for recent data or the customer-hosted Iceberg archive (via Athena) for data older than the per-log-type hot retention boundary.
         *
         *     Internal endpoint consumed by ms_front_gate resolvers — the UI continues to call the existing GraphQL operations, which now route through here.
         */
        post: operations["logQuery-query"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/log-query/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Continue a paginated log query
         * @description Resumes a cold-path Athena query using the cursor from a prior log-query response. Internal endpoint consumed by ms_front_gate when paginating archived results.
         */
        post: operations["logQuery-queryStatus"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/ndr/top-talkers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Rank accepted traffic by source workload or IP over whole UTC days */
        get: operations["network-ndrTopTalkers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/ndr/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** NDR dashboard headline totals for a time window */
        get: operations["network-ndrOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/ndr/volume-series": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Traffic bytes and flows over time by direction and action */
        get: operations["network-ndrVolumeSeries"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/ndr/external-destinations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Top egress destinations with geo, TOR and threat score */
        get: operations["network-ndrExternalDestinations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/ndr/ingress-ports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Internet ingress by destination port, accepted vs rejected */
        get: operations["network-ndrIngressPorts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/ndr/geo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Traffic by remote country, per direction and action */
        get: operations["network-ndrGeo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/ndr/rejected-sources": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Sources with the most rejected flows and the ports they hit most */
        get: operations["network-ndrRejectedSources"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/traffic-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Network Traffic Logs
         * @description Retrieves comprehensive network traffic logs from monitored environments, including connection metadata, source and destination details, protocol information, and traffic flow data.
         *
         *     Supports filtering by source/destination IP addresses, ports, protocols, connection states, traffic volumes, geographic regions, and time ranges.
         *
         *     Use this endpoint to analyze network communication patterns, identify suspicious traffic flows, and investigate connectivity issues across your infrastructure.
         *
         *     Paging is capped at 10,000 rows: `skip` + `limit` must not exceed it (400 otherwise) and `totalCount` saturates there — narrow the time range to reach older rows. Time bounds are RFC3339, e.g. "2026-08-18T09:00:00Z".
         */
        get: operations["network-trafficLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/traffic-graph": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get aggregated network traffic for the runtime-map graph view
         * @description Returns network traffic aggregated by the requested dimension (account, region, cluster_id, namespace, resource_type, dns_names, ip, or default).
         *
         *     Used by the runtime-map graph view to fetch each drilldown level on demand.
         *
         *     Pass cursor:null to page all results in stable identity order, following nextCursor until null. Without cursor, returns legacy top-N traffic buckets. size is a per-page limit.
         *
         *     Time bounds are UTC calendar days (YYYY-MM-DD), not RFC3339 instants. A request must cover 1-7 inclusive days.
         */
        post: operations["network-trafficGraph"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/k8s-audit-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Kubernetes Audit Logs
         * @description Retrieves detailed Kubernetes audit logs from monitored clusters, including API server events, resource access patterns, security policy violations, and administrative actions.
         *
         *     Supports filtering by namespace, resource type, verb actions, user identities, service accounts, admission controller decisions, and cluster-specific metadata.
         *
         *     Use this endpoint to monitor Kubernetes security posture, track privileged operations, investigate policy violations, and ensure compliance with cluster governance requirements.
         *
         *     Paging is capped at 10,000 rows: `skip` + `limit` must not exceed it (400 otherwise) and `totalCount` saturates there — narrow the time range to reach older rows. Time bounds are RFC3339, e.g. "2026-08-18T09:00:00Z".
         */
        get: operations["network-k8sAuditLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/identity-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get IAM Identity Activity Logs
         * @description Retrieves identity-related activity logs from monitored environments, including event metadata, principal and destination details, network information, and the raw event payload.
         *
         *     Supports filtering by account, action, identity, principal attributes, destination attributes, error details, region, timestamp, user agent, and other session context.
         *
         *     Use this endpoint to review identity activity and correlate actions with other security detections.
         *
         *     Paging is capped at 10,000 rows: `skip` + `limit` must not exceed it (400 otherwise) and `totalCount` saturates there — narrow the time range to reach older rows. Time bounds are RFC3339, e.g. "2026-08-18T09:00:00Z".
         */
        get: operations["network-identityLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/process-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Process Execution Logs
         * @description Retrieves aggregated process execution logs across all monitored resources (VMs, ECS tasks, pods). Returns processes including binary path, arguments, parent process, container, and execution count.
         *
         *     Supports filtering by resource ID (pod UID, instance ID, ECS task ID), binary name, parent process, container, namespace, cluster, account, and time range.
         *
         *     Use this endpoint to hunt for suspicious process executions, lateral movement, or malware activity across the environment.
         *
         *     SCOPING: this endpoint AGGREGATES across every monitored resource unless you narrow it. Pass `resource_id` (or `pod_name` together with `namespace`) whenever the question is about ONE resource. The counts returned are sums over whatever the filter matched, so an unscoped call can show that something happened in the environment but NOT that a particular resource did it — each result row names its own container/namespace/account, and that is what its number belongs to. Never attribute a count from an unscoped call to a specific resource: re-run it scoped first.
         */
        get: operations["network-processLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/file-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get File Access Logs
         * @description Retrieves aggregated file access logs across all monitored resources. Returns file operations including process, file path, operation type, container, and access count.
         *
         *     Supports filtering by file path, binary, container, namespace, cluster, account, and time range.
         *
         *     Use this endpoint to hunt for data exfiltration, unauthorized file modifications, or malware file drops across the environment.
         *
         *     SCOPING: this endpoint AGGREGATES across every monitored resource unless you narrow it. Pass `resource_id` (or `pod_name` together with `namespace`) whenever the question is about ONE resource. The counts returned are sums over whatever the filter matched, so an unscoped call can show that something happened in the environment but NOT that a particular resource did it — each result row names its own container/namespace/account, and that is what its number belongs to. Never attribute a count from an unscoped call to a specific resource: re-run it scoped first.
         */
        get: operations["network-fileLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/network/api-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get API Call Logs
         * @description Retrieves aggregated API call logs across all monitored resources. Returns HTTP requests including method, host, path, direction, destination, and call count.
         *
         *     Supports filtering by HTTP method, host, path, direction, container, namespace, cluster, account, and time range.
         *
         *     Use this endpoint to hunt for unauthorized API access, data exfiltration via HTTP, or communication with suspicious external services across the environment.
         *
         *     SCOPING: this endpoint AGGREGATES across every monitored resource unless you narrow it. Pass `resource_id` (or `pod_name` together with `namespace`) whenever the question is about ONE resource. The counts returned are sums over whatever the filter matched, so an unscoped call can show that something happened in the environment but NOT that a particular resource did it — each result row names its own container/namespace/account, and that is what its number belongs to. Never attribute a count from an unscoped call to a specific resource: re-run it scoped first.
         */
        get: operations["network-apiLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Notification Rules
         * @description Retrieves notification rules with optional filtering and pagination.
         *
         *     Notification rules define when and how users are notified about security events.
         *
         *     Results are returned in descending order by creation date.
         */
        get: operations["notifications-list"];
        put?: never;
        /**
         * Create Notification Rule
         * @description Creates a new notification rule with the specified configuration.
         *
         *     The rule will trigger alerts to configured destinations when matching events occur.
         */
        post: operations["notifications-create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Notification Rule
         * @description Retrieves a single notification rule by ID.
         *
         *     Returns the complete notification configuration including channels, conditions, and settings.
         */
        get: operations["notifications-get"];
        put?: never;
        post?: never;
        /**
         * Delete Notification Rule
         * @description Permanently deletes a notification rule.
         *
         *     This action cannot be undone.
         */
        delete: operations["notifications-delete"];
        options?: never;
        head?: never;
        /**
         * Update Notification Rule
         * @description Updates an existing notification rule.
         *
         *     Supports partial updates - only provided fields will be modified.
         */
        patch: operations["notifications-update"];
        trace?: never;
    };
    "/streamforce/agents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List StreamForce Agents
         * @description Retrieves StreamForce agents with optional filtering.
         */
        get: operations["streamforce-agents-list"];
        put?: never;
        /**
         * Create StreamForce Agent
         * @description Creates a new StreamForce agent.
         */
        post: operations["streamforce-agents-create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/agents/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get StreamForce Agent
         * @description Retrieves a single StreamForce agent by ID.
         */
        get: operations["streamforce-agents-get"];
        put?: never;
        post?: never;
        /**
         * Delete StreamForce Agent
         * @description Deletes a StreamForce agent and all its associated data.
         */
        delete: operations["streamforce-agents-delete"];
        options?: never;
        head?: never;
        /**
         * Update StreamForce Agent
         * @description Updates an existing StreamForce agent.
         */
        patch: operations["streamforce-agents-update"];
        trace?: never;
    };
    "/streamforce/agents/{id}/pause": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Pause StreamForce Agent
         * @description Pauses a StreamForce agent so the scheduler stops triggering runs.
         */
        post: operations["streamforce-agents-pause"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/agents/{id}/resume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resume StreamForce Agent
         * @description Resumes a paused StreamForce agent.
         */
        post: operations["streamforce-agents-resume"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/agents/{id}/trigger-run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Trigger StreamForce Agent Run
         * @description Triggers a manual run of a StreamForce agent. Executes asynchronously and returns the new run id.
         */
        post: operations["streamforce-agents-triggerRun"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/agents/{id}/recompile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Recompile StreamForce Agent
         * @description Recompiles a StreamForce agent's execution pipeline (re-runs the ms_ai compile step).
         */
        post: operations["streamforce-agents-recompile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List StreamForce Runs
         * @description Lists run history for a specific agent, with optional filtering (status, outcome, time, duration, run id), sorting and pagination.
         */
        get: operations["streamforce-runs-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/runs/by-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List StreamForce Runs by Status Bucket
         * @description Paginated runs for a single overview-tab bucket (running, awaiting_approval, completed, failed).
         */
        get: operations["streamforce-runs-listByStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/runs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get StreamForce Run
         * @description Retrieves details of a specific run including status, findings count, pipeline state, and timing.
         */
        get: operations["streamforce-runs-get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/runs/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cancel StreamForce Run
         * @description Cancels a running or pending StreamForce run.
         */
        post: operations["streamforce-runs-cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/runs/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Approve StreamForce Run
         * @description Approves a StreamForce run that is awaiting approval and dispatches its post-run actions.
         */
        post: operations["streamforce-runs-approve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/runs/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Reject StreamForce Run
         * @description Rejects a StreamForce run that is awaiting approval (the gated action is declined; the rest of the plan continues).
         */
        post: operations["streamforce-runs-reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/runs/{id}/actions/{action_id}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Retry StreamForce Run Action
         * @description Re-runs a single approved action that ended failed or unconfirmed, without re-running the agent.
         */
        post: operations["streamforce-runs-retryAction"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/findings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List StreamForce Findings
         * @description Lists findings for a specific run, with optional severity and status filters.
         */
        get: operations["streamforce-findings-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/findings/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get StreamForce Finding
         * @description Retrieves a specific finding including severity, description, reasoning steps, resource IDs, and references.
         */
        get: operations["streamforce-findings-get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/run-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List StreamForce Run Logs
         * @description Lists execution logs for a specific run, including tool calls, step progress, and agent reasoning.
         */
        get: operations["streamforce-logs-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/action-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List StreamForce Action Logs
         * @description Lists the actions taken during a run (response actions, runtime actions, tickets, notifications, plugin writes, and chain triggers) with their execution status.
         */
        get: operations["streamforce-actionLogs-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/pending-actions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List StreamForce In-Run Pending Actions
         * @description Lists the in-run captured actions for a run (approval-required tool calls and their post-approval execution outcomes), ordered by capture sequence.
         */
        get: operations["streamforce-pendingActions-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/dashboard/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * StreamForce Dashboard Stats
         * @description Retrieves aggregated stats for the StreamForce dashboard.
         */
        get: operations["streamforce-dashboard-stats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/action-catalog": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List StreamForce Action Catalog
         * @description Returns the tool catalog surfaced to the Agent Builder. Includes per-action integrations (Jira), broad-group integrations (Stream, legacy 3rd-party), and coming-soon placeholders.
         */
        get: operations["streamforce-actionCatalog-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/action-catalog/test-webhook": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Test a connected custom webhook
         * @description POSTs a minimal test-labeled ping to a connected custom webhook and returns whether it is reachable and its stored auth was accepted.
         */
        post: operations["streamforce-actionCatalog-testWebhook"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/response-catalog": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List StreamForce response action catalog
         * @description Returns the selectable Cloud Response runbooks and Runtime Response actions for the per-agent response scope allowlist.
         */
        get: operations["streamforce-responseCatalog-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/kb": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List KB documents
         * @description Retrieves StreamForce knowledge base documents with optional filtering.
         */
        get: operations["streamforce-kb-list"];
        put?: never;
        /**
         * Create KB document
         * @description Creates a StreamForce knowledge base document and ingests it in the background.
         */
        post: operations["streamforce-kb-create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/kb/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get KB document
         * @description Retrieves a single StreamForce knowledge base document with its sections.
         */
        get: operations["streamforce-kb-get"];
        put?: never;
        post?: never;
        /**
         * Delete KB document
         * @description Deletes a StreamForce knowledge base document and all its sections.
         */
        delete: operations["streamforce-kb-delete"];
        options?: never;
        head?: never;
        /**
         * Update KB document
         * @description Updates a StreamForce knowledge base document, re-ingesting when its content changed.
         */
        patch: operations["streamforce-kb-update"];
        trace?: never;
    };
    "/streamforce/kb/upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Upload KB document file
         * @description Creates a StreamForce knowledge base document from an uploaded file (.txt, .md, .pdf, .docx). Text is extracted server-side and ingested in the background; the original file is not retained.
         */
        post: operations["streamforce-kb-upload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/kb/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Search the knowledge base
         * @description Search the customer knowledge base for the sections most relevant to a query. The KB holds the org-specific context an agent needs to understand this environment: runbooks, asset and account ownership, escalation policies, environment and infrastructure/architecture notes, application and business-logic descriptions, team and organization structure, and prior incidents. Matches both prose and exact identifiers — hostnames, account IDs, ARNs, IPs, emails, team names. Returns short summaries + snippets ranked by relevance; call kb__getDoc with a returned doc_id/section_id to read the full section. Empty results mean no matching KB entry exists — do not retry the same query.
         */
        post: operations["streamforce-kb-search"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streamforce/kb/doc/{doc_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read a knowledge base document
         * @description Read a knowledge base document by doc_id (from kb__search). Returns the document metadata (including total_sections) and up to 5 sections ordered by position, each with content truncated to keep the response small (truncated=true marks a clipped section). To read a clipped section in full, or sections beyond the first 5, call again with that section_id — a single-section request returns a much larger slice.
         */
        get: operations["streamforce-kb-getDoc"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/simulation/event": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Simulate the impact of a proposed resource change
         * @description Simulates the security blast radius of a proposed cloud resource change before it is applied — bypasses Terraform translation and feeds pre-translated before/after records straight into the modeler and analyzer.
         *
         *     Returns the new rule violations introduced by the change and a summary of affected connectivity/permissions paths grouped by (src_type, dst_type). Path lists can be very large — only counts are returned per type-pair, separated into new, closed, and modified buckets per topology.
         *
         *     Use this tool when the caller (a StreamForce agent or a UI flow) has a concrete proposed change and needs to evaluate risk before committing it.
         */
        post: operations["simulation-simulateEventImpact"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Posture Rules
         * @description Retrieves posture rules that define security, compliance, or configuration requirements for monitored environments. Each rule includes metadata such as name, description, severity, category, compliance mappings, status, state, finding type, remediation guidance, and associated labels.
         *
         *     Use this endpoint to review and manage the set of posture rules applied across your environment, identify active requirements, and assess compliance coverage.
         */
        get: operations["rules-list"];
        put?: never;
        /**
         * Create Posture Rule
         * @description Create a posture rule (resource or path) with predicate-based conditions. Pass the rule definition as `{ rule: { rule_type: "resource" | "path", ... } }`.
         */
        post: operations["rules-create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rules/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Search Posture Rules
         * @description Server-side paginated search for posture rules with inline violation counts, exclusion counts, and severity aggregation. Supports filtering by severity, category, labels, compliance, status, and more.
         */
        post: operations["rules-search"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rules/facets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get Posture Rules Facets
         * @description Returns distinct filter values for the posture rules sidebar: severities, categories, labels, compliance frameworks, creators, statuses, rule types, and finding types.
         */
        post: operations["rules-facets"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rules/bulk/update": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Bulk Update Posture Rules
         * @description Bulk update posture rules by explicit IDs or by filter criteria. Supports updating severity, state, fail_simulation, notification_channels, and exclusion predicates.
         */
        put: operations["rules-bulkUpdate"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rules/bulk/update-list-fields": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Bulk Update Posture Rules List Fields
         * @description Bulk add or remove values from array fields (labels, compliance) on posture rules, by explicit IDs or by filter criteria.
         */
        put: operations["rules-bulkUpdateListFields"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rules/common-fields": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get Common Field Values Across Filtered Rules
         * @description Returns the intersection of array field values (labels, compliance) across all rules matching the given filters.
         */
        post: operations["rules-commonFields"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rules/rule/{rule_id}/violations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Rule Violations
         * @description Retrieves all violations triggered by a specific detection or compliance rule.
         *
         *     Each violation represents a resource that has failed the rule’s evaluation, indicating a misconfiguration, security risk, or policy non-compliance.
         */
        get: operations["rules-ruleViolationsRest"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rules/resource/{resource_id}/violations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Resource Violations
         * @description Retrieves all policy violations and security findings associated with a specific resource.
         *
         *     A violation represents a misconfiguration, excessive permission, or risky exposure detected on the asset, including:
         *
         *     * Security misconfigurations (e.g., public access, weak authentication, missing encryption)
         *
         *     * Resources that can be accessed from this asset — such as databases, storage buckets, crown-jewel systems, AI models, or accounts with administrative or high-level privileges
         *
         *     * Privilege escalation risks and excessive permissions
         *
         *     Each result includes the violation’s category, severity, rule name, finding type, and the discovery timestamp (when the issue was first detected).
         */
        get: operations["rules-resourceViolations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rules/exclusions/add": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Create Rule Exclusion
         * @description Exclude specific resources from a security rule. Use this when a finding is a known exception or accepted risk for specific resources.
         */
        put: operations["rules-createExclusion"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rules/exclusions/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Remove Rule Exclusion
         * @description Remove resource exclusions from a security rule, making the rule apply to those resources again.
         */
        put: operations["rules-deleteExclusion"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * List Cases
         * @description Lists security investigation cases with optional filters, sorting, and pagination.
         */
        post: operations["cases-list"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Case
         * @description Retrieves a single case by its ID.
         */
        get: operations["cases-get"];
        /**
         * Update Case
         * @description Updates case fields such as title, description, priority, or tags.
         */
        put: operations["cases-update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create Case
         * @description Creates a new investigation case, optionally linking existing detections.
         */
        post: operations["cases-create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Update Case Status
         * @description Changes the status of a case (open, in_progress, closed, remediated).
         */
        put: operations["cases-setStatus"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/assign": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Assign Case
         * @description Assigns a case to a user or agent.
         */
        put: operations["cases-assign"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/severity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Update Case Severity
         * @description Changes the severity level of a case (1-4).
         */
        put: operations["cases-setSeverity"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/escalate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Escalate Case
         * @description Marks a case as escalated with a reason.
         */
        put: operations["cases-escalate"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/verdict": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Set Case Verdict
         * @description Sets the analyst verdict on a case.
         */
        put: operations["cases-setVerdict"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/board": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get Cases Board
         * @description Returns cases grouped by status for Kanban board display.
         */
        post: operations["cases-board"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Case Timeline
         * @description Returns the timeline of all actions on a case (comments, status changes, detection additions, etc.).
         */
        get: operations["cases-timeline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/detections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Add Detections to Case
         * @description Links one or more detections to an existing case.
         */
        post: operations["cases-detections-add"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/detections/{detection_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Remove Detection from Case
         * @description Unlinks a detection from a case.
         */
        delete: operations["cases-detections-remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/comment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Edit Case Comment
         * @description Edits an existing comment on a case.
         */
        put: operations["cases-comment-edit"];
        /**
         * Add Case Comment
         * @description Adds a comment to a case.
         */
        post: operations["cases-comment-create"];
        /**
         * Delete Case Comment
         * @description Soft-deletes a comment on a case.
         */
        delete: operations["cases-comment-delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/playbook/apply-template": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Apply Playbook Template to Case
         * @description Applies a playbook template to an existing case, appending its checklist items to the current playbook.
         */
        post: operations["cases-playbook-applyTemplate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/playbook/adhoc": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Apply Ad-hoc Playbook
         * @description Attaches a one-off playbook (name + steps) to a case without persisting it as a saved playbook.
         */
        post: operations["cases-playbook-applyAdhoc"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/playbook/{playbook_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Remove Playbook from Case
         * @description Removes an applied playbook (all of its steps) from a case by playbook id.
         */
        delete: operations["cases-playbook-remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/playbook/{playbook_id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Toggle Playbook Completed
         * @description Marks an attached playbook as completed (or not) on a case. A playbook is a single unit — completion is set at the playbook level, not per step.
         */
        put: operations["cases-playbook-toggle"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/notes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Add Case Note
         * @description Adds a note to a case.
         */
        post: operations["cases-notes-add"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/notes/{note_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Update Case Note
         * @description Updates the name and body of an existing case note.
         */
        put: operations["cases-notes-update"];
        post?: never;
        /**
         * Remove Case Note
         * @description Removes a note from a case.
         */
        delete: operations["cases-notes-remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/playbook-templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Playbook Templates
         * @description Returns all playbook templates available in the workspace.
         */
        get: operations["cases-playbookTemplates-list"];
        put?: never;
        /**
         * Create Playbook Template
         * @description Creates a reusable playbook template with checklist items.
         */
        post: operations["cases-playbookTemplates-create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/playbook-templates/{template_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Playbook Template
         * @description Returns a single playbook template by id.
         */
        get: operations["cases-playbookTemplates-get"];
        /**
         * Update Playbook Template
         * @description Updates an existing playbook template.
         */
        put: operations["cases-playbookTemplates-update"];
        post?: never;
        /**
         * Delete Playbook Template
         * @description Deletes a playbook template.
         */
        delete: operations["cases-playbookTemplates-delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/link-ticket": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Link Ticket to Case
         * @description Links an external ticket (Jira, ServiceNow, etc.) to a case.
         */
        post: operations["cases-linkTicket"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/relate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Relate Cases
         * @description Links two cases as related or sets a parent-child relationship.
         */
        put: operations["cases-relate"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/relate/{related_case_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Unlink Related Cases
         * @description Removes the related-case link between two cases.
         */
        delete: operations["cases-unrelate"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/related": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Related Cases
         * @description Returns all cases related to or parenting the given case.
         */
        get: operations["cases-related"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Archive Case
         * @description Archives a case so it is hidden from the main view by default. An optional reason can be supplied.
         */
        put: operations["cases-archive"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cases/{case_id}/unarchive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Unarchive Case
         * @description Restores an archived case so it returns to the main view.
         */
        put: operations["cases-unarchive"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Detections
         * @description Retrieves detections from monitored environments, including metadata such as detection ID, timestamp, severity, account, resource details, source, MITRE categories, signal types, and any related anomalous actions.
         *
         *     You can filter results by detection ID, resource ID, or workspace, and use pagination to control the number of alerts returned. This endpoint is designed for retrieving detection listings - use the investigation endpoint to view full detection details for triage and investigation.
         */
        get: operations["detections-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/{detection_id}/ai_summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Detection AI Summary
         * @description Retrieves an AI-generated summary for a specific detection, providing a concise verdict, confidence score, and contextual explanation of the activity. This includes relevant behaviors, potential risks, and whether further investigation is recommended.
         *
         *     EXPENSIVE: each call runs a full AI investigation server-side over the detection’s identity/process/flow logs (several seconds, significant cost). Use it for at most 1-2 detections that genuinely need a verdict — when iterating over many detections, use the raw detections list data or investigator tools instead.
         */
        get: operations["detections-summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/baseline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Principal Baseline Data
         * @description Retrieves baseline activity patterns for a specified principal within monitored environments. The baseline includes the principal’s first and last seen timestamps, typical active days and hours, most common actions, accessed services, and historical destinations. This data helps establish normal behavior for the principal and supports anomaly detection or investigative workflows.
         *
         *     The response provides aggregated metrics such as event counts, regional activity distribution, and service usage frequency, along with identity details like controller type and controller ID.
         */
        get: operations["detections-baseline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/api-baseline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get API-call Baseline For a Workload
         * @description Retrieves only the API-call baseline (observed HTTP endpoints) for a workload covered by a runtime agent with API security enabled. Returns the distinct direction/host/path/process combinations with their HTTP methods and first/last seen timestamps.
         */
        get: operations["detections-apiBaseline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/identity-baseline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Identity-activity Baseline For a Principal
         * @description Retrieves only the identity baseline (observed cloud actions) for a principal. Returns the distinct actions with their event counts and last-seen timestamps.
         */
        get: operations["detections-identityBaseline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/activity-baseline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get When-and-Where Baseline For a Principal
         * @description Returns the learned activity baseline for a principal, split by source: cloud activity logs and Kubernetes audit logs. Each source carries its own first/last seen, the weekday and hour windows it was active in, the countries it acted from, and the actions it used with the service or Kubernetes resource kind each belongs to.
         */
        get: operations["detections-activityBaseline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/runtime-baseline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Runtime Baseline For a Principal
         * @description Returns the learned runtime baseline for a workload or machine: the processes it runs with the parents, working directories and syscalls each was seen with, the files each process touched, the inventory destinations it opened connections to, and the HTTP endpoints it called or served. Learned from first sighting rather than over a time window, so every entry is a set membership rather than a volume.
         */
        get: operations["detections-runtimeBaseline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/top/{group_by}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Top Detections
         * @description Retrieves the top detections from monitored environments.
         */
        get: operations["detections-top"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Update Detection Status
         * @description Updates the status of a detection to reflect its current investigation state, such as open, in progress, or closed.
         *
         *     Optional `comment` records WHY the status changed and is stored on the detection activity log; when the new status is `closed` it is also recorded as the detection acknowledgement reason, which is shown on the detection and cannot be edited afterwards. Write the evidence, not a label: what was observed, which process or identity, and what ruled it benign or malicious. Limit 2000 characters.
         */
        put: operations["detections-setStatus"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/triage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Update Detection Triage
         * @description Records a triage assessment on a detection: the recommended verdict, the confidence in it, and the written analysis behind them.
         *
         *     The two text fields are not interchangeable. `triage_summary` is the verdict in 2-3 sentences, and it also replaces the detection notification summary. `triage_reasoning` is the full evidence and analysis, rendered as markdown on the detection.
         *
         *     Send `triage_reasoning` whenever you have analysis to record. It is optional: omitting it leaves any analysis already stored on the detection untouched, so a call without it cannot ADD analysis, only leave the previous one standing. Sending an empty string deliberately clears it. Put the evidence in reasoning; keep the summary to the verdict.
         */
        put: operations["detections-setTriage"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/{id}/activities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Detection Activity Wall
         * @description Retrieves the full activity history for a detection, including creation, status changes, and comments.
         */
        get: operations["detections-activities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/metrics/mttr-mtta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get MTTR and MTTA Metrics
         * @description Retrieves Mean Time To Resolution (MTTR) and Mean Time To Acknowledge (MTTA) metrics for detections.
         *
         *     MTTR measures the average time from detection creation to status change to closed. MTTA measures the average time from detection creation to status change to in_progress.
         *
         *     Results include overall averages and daily trend data points. Supports filtering by account.
         */
        get: operations["detections-mttrMtta"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/link-ticket": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Link Existing Ticket to Detection
         * @description Links an already-created external ticket (ServiceNow, Jira, etc.) to one or more detections. The ticket appears in the detection activity timeline.
         */
        post: operations["detections-linkTicket"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/verdict": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Set Detection Verdict
         * @description Sets the analyst verdict on one or more detections.
         */
        put: operations["detections-setVerdict"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/acknowledge": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Acknowledge Detections
         * @description Acknowledge or revoke one or more detections with an optional reason.
         */
        put: operations["detections-acknowledge"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detections/comment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Add Detection Comment
         * @description Adds a comment to a detection to capture analyst notes, investigation context, findings, or additional observations for collaboration between analysts.
         *
         *     The comment is stored on the detection activity log (no status change). Limit 2000 characters.
         */
        post: operations["detections-comment-create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detection_rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Detection Rules
         * @description Retrieves detection rules with server-side pagination, filtering, sorting, and text search.
         *
         *     Supports filtering by severity, type, enabled status, labels, log_type, and created_by.
         *
         *     Returns paginated results along with total count.
         */
        get: operations["detectionRules-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detection_rules/{detection_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Detection Rule Details
         * @description Retrieves the full definition and configuration of a detection rule by its unique ID.
         *
         *     The response includes the rule's name, severity, description, classification labels, notification channels, triggering conditions,  any exclusion criteria, creation date and status.
         *
         *     Use this endpoint to review or validate a rule's configuration, troubleshoot false positives, and audit detection coverage.
         */
        get: operations["detectionRules-details"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detection-rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create Detection Rule
         * @description Create a new detection rule with structured filter conditions.
         */
        post: operations["detectionRules-create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detection-rules/{rule_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete Detection Rule
         * @description Delete a detection rule by id. Predefined rules cannot be deleted.
         */
        delete: operations["detectionRules-delete"];
        options?: never;
        head?: never;
        /**
         * Modify Detection Rule
         * @description Update a detection rule. Only provide the fields you want to change — omitted fields are left unchanged. `condition` is ATOMIC: sending it replaces main_filter AND every exclude entry, so re-sending a condition reconstructed from a read can silently drop concurrent excludes. Use this for enable/disable and severity changes; use addExclude to add an exclude filter.
         */
        patch: operations["detectionRules-modify"];
        trace?: never;
    };
    "/detection-rules/{rule_id}/excludes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Add Detection Rule Exclude
         * @description Append ONE exclude entry to a detection rule, preserving every existing exclude. Send only the new entry — it is read from the server and merged, so it does not overwrite concurrent excludes the way re-sending a full reconstructed condition through modify does (a narrow read-then-write window remains between two near-simultaneous addExclude calls). The entry may be a leaf ({field, match_type, value}) or a group ({operand, filters:[...]}), with an optional comment. A duplicate of an existing entry is a no-op.
         */
        post: operations["detectionRules-addExclude"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detection-rules/preview-matches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Preview Detection Rule Matches
         * @description Preview how many activities match a detection rule condition. Returns total match count and up to 5 sample activities for analysis. This is the programmatic equivalent of the UI "Preview Match" button.
         */
        post: operations["detectionRules-previewMatches"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detection_rules/facets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Detection Rule Facets
         * @description Retrieves aggregated counts of distinct values for a given field, scoped to the active filters and text search.
         *
         *     Use this to populate filter option counts in the UI.
         */
        get: operations["detectionRules-facets"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/detection_rules/bulk": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Bulk Modify Detection Rules
         * @description Applies changes to all detection rules matching the given filters.
         *
         *     Supports modifying enabled status, severity, notification channels, and labels.
         */
        patch: operations["detectionRules-bulkModify"];
        trace?: never;
    };
    "/response-actions/options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get available response actions for a resource
         * @description Returns the list of response action runbooks available for a specific resource. Call this FIRST to discover what actions can be taken, then use invoke to execute one.
         */
        get: operations["responseActions-getOptions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/response-actions/invoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Execute a response action on a resource
         * @description Invoke a response action runbook on a specific resource. Use getOptions first to discover available runbooks and their IDs.
         */
        post: operations["responseActions-invoke"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-actions/options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get available runtime agent actions for a resource
         * @description Returns the list of runtime agent actions available for a specific resource, filtered by resource type (K8s pod, ECS task, VM). Also indicates whether a runtime agent is connected. Call this FIRST before invoking any agent action.
         */
        get: operations["agentActions-getOptions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-actions/invoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Execute a runtime agent action on a resource
         * @description Dispatch a runtime agent action (kill process, block IP, delete pod, etc.) to a connected agent. Use getOptions first to discover available actions. The action is dispatched asynchronously — poll getHistory to check completion status.
         */
        post: operations["agentActions-invoke"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-actions/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get history of runtime agent actions
         * @description Query the execution history of runtime agent actions, optionally filtered by resource, detection, or action type. Use this to poll for action completion after invoking.
         */
        get: operations["agentActions-getHistory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-actions/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cancel a pending runtime agent action
         * @description Cancel a pending agent action before it is dispatched to the agent. Only actions in "pending" status can be cancelled.
         */
        post: operations["agentActions-cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-actions/exec-read-only-shell": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Run a READ-ONLY shell command on a resource via the runtime agent
         * @description Run a strictly READ-ONLY shell command on a resource (VM host, K8s pod container, or ECS task) through the connected runtime agent — the "Host Shell" / "Container Shell" capability, restricted to investigation.
         *
         *     WHAT IS ALLOWED: only inspection commands (cat, ls, ps, ss, netstat, lsof, ip, grep, find, journalctl, systemctl status/show, etc.), optionally chained with a single pipe (`|`). The command is validated server-side BEFORE dispatch; any write/mutating command, shell chaining (`;`, `&&`, `||`, `&`), command/parameter substitution (`$(...)`, backticks, `${...}`), output redirection (`>`, `>>`), privilege escalation (sudo/su) or a non-allowlisted binary is REJECTED and nothing is dispatched. This tool can NEVER modify the host.
         *
         *     WORKFLOW:
         *     1. Optionally call agentActions__getOptions({ resourceId }) to confirm a runtime agent is connected.
         *     2. agentActions__execReadOnlyShell({ resourceId, command, containerName? }) → dispatches asynchronously, returns { id, status: "pending" }.
         *     3. agentActions__getHistory({ resourceId }) → poll until the matching action reaches a terminal status; the command output is in the action result.
         *
         *     Notes: each command runs independently via /bin/sh with a ~30s timeout. For K8s pods / ECS tasks pass containerName to target a specific container; leave it empty for VM/host resources (runs on the host).
         */
        post: operations["agentActions-execReadOnlyShell"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get User Preferences
         * @description Returns the current user's email-notification preferences.
         */
        get: operations["users-preferences-get"];
        put?: never;
        /**
         * Update User Preferences
         * @description Updates the current user's email-notification preferences.
         */
        post: operations["users-preferences-update"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/workloads/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get AI Workload Summary
         * @description Retrieves AI workload detection signals for a specific resource, including providers, models, usage types, and confidence levels.
         */
        get: operations["workloads-summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/workspaces": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get workspaces */
        get: operations["workspaces-list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List CVEs with filtering, sorting, and pagination
         * @description Retrieves a list of detected vulnerabilities (CVEs) across monitored environments, with details such as severity, CVSS score, exploit and fix availability, affected packages, impacted resources, and remediation guidance.
         *
         *     Supports filtering by CVE ID, account, resource, resource type, package name, severity, exploit availability, fix availability, internet exposure, and region. Results can be sorted by CVE ID, severity, CVSS score, discovery time, or published date.
         *
         *     Use this endpoint to review and prioritize vulnerabilities for remediation based on severity, exploitability, and exposure context.
         */
        get: operations["cve-listCves"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Query CVEs with advanced filtering
         * @description Retrieves a list of CVEs from PostgreSQL with full filtering, sorting, and pagination support.
         *
         *     Supports complex nested filters including tags, score comparisons, and date ranges.
         *
         *     Use this endpoint when you need advanced filtering capabilities not available in GET /cve.
         */
        post: operations["cve-listCvesPost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Export CVEs to CSV format
         * @description Exports CVEs matching the provided filters to CSV format.
         *
         *     Returns the CSV content as a string along with a suggested filename.
         *
         *     Supports all the same filters as the listCves endpoint.
         */
        post: operations["cve-exportCves"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/export/resources": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Export CVE-affected resources to CSV format
         * @description Exports resources affected by CVEs matching the provided filters to CSV format.
         *
         *     Returns the CSV content as a string along with a suggested filename.
         */
        post: operations["cve-exportCveResources"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/export/images": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Export CVE-affected images to CSV format
         * @description Exports container images affected by CVEs matching the provided filters to CSV format.
         *
         *     Returns the CSV content as a string along with a suggested filename.
         */
        post: operations["cve-exportCveImages"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/facets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get CVE facet values for filter autocomplete
         * @description Returns distinct values for a specified facet field to populate filter dropdowns.
         *
         *     Supports filtering by cve_id, packages, resource_id, resource_tag_key, and resource_tag_value.
         *
         *     Results can be filtered by an optional phrase for autocomplete functionality.
         *
         *     For resource_id, the search matches both resource_id and display_name but returns only resource_ids.
         *
         *     For resource_tag_value, optionally provide tag_key to filter values by a specific key.
         */
        post: operations["cve-listFacets"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/trends": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get CVE trends over time
         * @description Retrieves CVE trends from the cve_daily_aggregations table.
         *
         *     Array filters accept comma-separated values (e.g., severity=CRITICAL,HIGH).
         *
         *     For complex filters, use the POST /cve/trends/query endpoint instead.
         */
        get: operations["cve-getCveTrends"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/trends/query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Query CVE trends with advanced filtering
         * @description Retrieves CVE trends from the cve_daily_aggregations table.
         *
         *     Supports grouping by severity, CVE ID, or account.
         *
         *     Supports time periods: past_week, past_month, past_year.
         *
         *     Can filter by CVE characteristics and risk factors.
         *
         *     Returns daily aggregated counts for charting and analysis.
         */
        post: operations["cve-getCveTrendsPost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/severity-summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get CVE severity summary
         * @description Retrieves current CVE counts grouped by severity from live tables (cve_details joined with resource_vulnerabilities and inventory_*).
         *
         *     Aggregation is computed on the fly against the latest generation; pre-aggregated daily tables are intentionally not used because they lose resolution needed by the filters.
         *
         *     Supports the same filters as the CVE list endpoint.
         *
         *     Returns severity counts for CRITICAL, HIGH, MEDIUM, and LOW.
         *
         *     Designed for pie chart visualization.
         */
        post: operations["cve-getCveSeveritySummary"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/resources": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List resources affected by CVE(s)
         * @description Retrieves a list of resources affected by specified CVE(s) with filtering and pagination.
         *
         *     Array filters accept comma-separated values (e.g., cve_ids=CVE-2021-44228,CVE-2021-45046).
         *
         *     For complex filters like tags, use the POST /cve/resources/query endpoint instead.
         */
        get: operations["cve-listCveResources"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/resources/query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Query resources affected by CVE(s) with advanced filtering
         * @description Retrieves a list of resources affected by specified CVE(s) with filtering and pagination.
         *
         *     Supports complex nested filters including tags.
         *
         *     Returns resource details including exposure risk, internet exposure status, and associated container images.
         */
        post: operations["cve-listCveResourcesPost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/resources/grouped": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * List CVE resources grouped by attribute
         * @description Returns resource counts grouped by a specified attribute (account, resource type, cluster, namespace, or region).
         *
         *     Useful for displaying aggregated views of affected resources.
         */
        post: operations["cve-listCveResourcesGrouped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/images": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * List images affected by CVE(s)
         * @description Retrieves a list of container images affected by specified CVE(s) with filtering and pagination.
         *
         *     Returns image details including affected resource count, internet exposure status, and associated clusters/namespaces.
         *
         *     Supports filtering by CVE IDs, image ID, account, resource type, region, cluster, and namespace.
         */
        post: operations["cve-listCveImages"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/grouped": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * List CVEs grouped by attribute
         * @description Returns CVEs grouped by a specified attribute (currently only packages).
         *
         *     Each group includes total CVE count, exploitable CVE count, and severity breakdown.
         *
         *     Useful for displaying aggregated views of vulnerabilities in the resource panel.
         */
        post: operations["cve-listCvesGrouped"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/resources/facets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get CVE resource facet values for filter autocomplete
         * @description Returns distinct values for a specified facet field to populate filter dropdowns in the CVE Resources view.
         *
         *     Supports filtering by account_id, resource_type, region, resource_id, vpc, cluster_id, namespace_id, container_images, and ticket_id.
         *
         *     Results can be filtered by an optional phrase for autocomplete functionality.
         *
         *     For resource_id, the search matches both resource_id and display_name but returns only resource_ids.
         */
        post: operations["cve-listResourceFacets"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/resources/ticket-facets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get CVE ticket-id facet values for filter autocomplete
         * @description Returns ticket keys for the "Ticket Id" filter dropdown in the CVE Resources view.
         *
         *     Ticket data is served by the events service, not the CVE Postgres facets.
         *
         *     Filtered by an optional phrase for autocomplete; scoped to a CVE via filters.cve_ids.
         */
        post: operations["cve-resourceTicketFacets"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/images/facets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get CVE image facet values for filter autocomplete
         * @description Returns distinct values for a specified facet field to populate filter dropdowns in the CVE Images view.
         *
         *     Supports filtering by image_id, image_type, registry_id, repository_id, account_id, cluster_ids, namespace_ids, and ticket_id.
         *
         *     Results can be filtered by an optional phrase for autocomplete functionality.
         */
        post: operations["cve-listImageFacets"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/ai_summary/{cve_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get CVE AI Analysis
         * @description Retrieves an AI-generated analysis of a specific CVE, including attack vector details, exploitation path, and contextual insights into how the vulnerability can be leveraged. The summary explains potential impact, exploitation requirements, and conditions that may limit or enable an attack.
         *
         *     Use this endpoint to quickly understand the technical implications and exploitation feasibility of a vulnerability before prioritizing remediation.
         */
        get: operations["cve-getAiSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/{cve_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single CVE by ID
         * @description Retrieves detailed information about a specific CVE by its ID.
         */
        get: operations["cve-getCve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/exclusions/specific/query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * List specific vulnerability exclusions
         * @description Lists per-resource, per-controller, and per-image vulnerability exclusions. Optionally filter by CVE id (cveId, integer form) or subject id (resource_id or image digest). Returns each exclusion with its id, CVE int id, subject kind (resource/image), subject id, who excluded it, the comment, and the exclusion timestamp.
         */
        post: operations["cve-exclusions-specific-query"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/exclusions/specific/add": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Exclude resources/controllers/images from a CVE
         * @description Excludes one or more subjects from a single CVE. Each subject is either kind 'resource' with a resource_id (covers standalone resources AND controllers like Deployments/ASGs — all controlled resources are auto-excluded), or kind 'image' with an image digest (all resources running that image are excluded). Excluded items are hidden from every user-facing CVE view, every count, and the attack-path engine. A non-empty comment explaining the reason is required and recorded for audit. Returns the inserted exclusion ids.
         */
        post: operations["cve-exclusions-specific-add"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/exclusions/specific/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Un-exclude specific vulnerability exclusions
         * @description Removes one or more per-resource/per-controller/per-image exclusions by their exclusion ids (the id returned by the specific.query and specific.add endpoints). After deletion the underlying resources/images reappear in CVE views and the attack-path engine will reconsider them on the next modeler run. Returns the count of rows actually deleted.
         */
        post: operations["cve-exclusions-specific-delete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/exclusions/specific/count-by-cve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Specific-exclusion counts per CVE
         * @description Returns a per-CVE count of how many specific (resource / controller / image) exclusions exist. Useful for surfacing exclusion badges next to each CVE in a list, or for deciding whether a CVE has been partly muted before deciding to entirely exclude it.
         */
        get: operations["cve-exclusions-specific-countByCveId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/exclusions/cve/query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * List customer-wide entire-CVE exclusions
         * @description Lists CVEs that have been excluded customer-wide. Each entry represents a CVE that is hidden across every view, every count, and the attack-path engine — including future affected resources. Returns exclusion id, CVE int id, CVE label (e.g. CVE-2025-1234), severity, who excluded it, the comment, and the exclusion timestamp.
         */
        post: operations["cve-exclusions-cve-query"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/exclusions/cve/add": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Exclude entire CVEs customer-wide
         * @description Excludes one or more CVEs entirely for this customer. Once excluded, every current and future affected resource is auto-hidden from CVE lists, dashboards, counts, daily aggregations, and the attack-path engine. Use only when you are confident the CVE does not apply (e.g., feature not used, compensating control in place). A non-empty comment explaining the reason is required and recorded for audit. Returns the inserted exclusion ids.
         */
        post: operations["cve-exclusions-cve-add"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cve/exclusions/cve/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Un-exclude customer-wide CVE exclusions
         * @description Removes one or more customer-wide CVE exclusions by their exclusion ids (the id returned by cve.query / cve.add). After deletion the affected CVEs reappear in every view and the attack-path engine will reconsider them on the next modeler run. Returns the count of rows actually deleted.
         */
        post: operations["cve-exclusions-cve-delete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sbom/packages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * List installed packages across scanned workloads
         * @description Returns the package inventory extracted from SBOMs, one row per package identity (normalized PURL).
         *
         *     Counts are per live workload: installed, plus the runtime breakdown (executed / loaded / not measured). A workload is the controller where the resource has one, so a ReplicaSet counts once however many pods run it (DEV-22080); callers that read these as pod counts will see smaller numbers.
         *
         *     Runtime status is only known for packages carrying a CVE today; everything else reports as not measured rather than zero.
         *
         *     group_by_name changes what a page is: limit and skip then apply to package NAMES rather than rows, the response carries every version of each name in the page, and total_count is the number of names. Left unset the endpoint behaves as before.
         */
        post: operations["sbom-listPackages"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sbom/packages/resources": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * List the workloads carrying a package
         * @description Drill-down for one package: every live workload it is installed on, with runtime status, file paths and last scan. A row is a controller where the resource has one, so a ReplicaSet appears once however many pods run it, with resource_count giving the number behind the row (DEV-22080). The unit is the pod controller ownerReference, which for a Deployment is its ReplicaSet, so a rollout shows the old and new ReplicaSets as two rows while both have pods. Callers that counted rows as resources before this change will see fewer.
         */
        post: operations["sbom-listPackageResources"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sbom/packages/vulnerabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * CVEs affecting one package
         * @description One row per CVE, not per (CVE, resource): a CVE affecting this package on 96 machines is one thing to fix, and resource_count carries the blast radius.
         *
         *     Ordered by severity then EPSS - severity alone leaves a wall of criticals in arbitrary order, and EPSS is the only field here that says which are actually being exploited.
         *
         *     Scoped to resources that carry this package, so an unrelated CVE on the same machine is not attributed to it.
         */
        post: operations["sbom-listPackageVulnerabilities"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sbom/coverage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * SBOM scan coverage summary
         * @description Scanned vs scannable resources and package totals. Distinguishes a resource that was scanned and has no packages from one that was never scanned.
         */
        get: operations["sbom-coverage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sbom/packages/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Export the package inventory to CSV
         * @description Exports the packages matching the supplied filters and sort, not the whole table - the file has to agree with the view it was taken from.
         *
         *     The four runtime counts are separate columns rather than the collapsed on-screen label, so the file is pivotable.
         *
         *     Large result sets stop at a row cap and set `truncated`; a truncated CSV is indistinguishable from a complete one, so callers must surface it.
         */
        post: operations["sbom-exportPackages"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/aev/resolve-target": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resolve an internet-facing probe target
         * @description AEV scope gate. Confirms the resource is internet-facing per Stream, resolves the public host to probe (its own public address, or the fronting load balancer via associated resources), and mints a signed grant the plugin validates before probing.
         *
         *     Returns in_scope:false with a reason (and no grant) when the resource is not internet-facing or no public fronting host can be resolved — nothing downstream may probe it.
         *
         *     Always call this with the VULNERABLE resource’s own ID, never a fronting load balancer / API Gateway / CDN — this resolver discovers and probes through the fronting edge itself.
         */
        post: operations["aev-resolveTarget"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/aev/oob-token": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Mint an out-of-band callback token
         * @description Mints + registers an out-of-band callback token and URL. The agent embeds the URL in a blind (HTTP) validation payload; a callback confirms the payload reached and ran on the in-scope target. callback_url is absent when no public host can be determined (degrade to detection-only).
         */
        post: operations["aev-mintOobToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/aev/oob-interactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Poll out-of-band callback hits for a token
         * @description Returns any callbacks recorded for the token. hit:true confirms a blind validation payload ran on the in-scope target (it issued the out-of-band callback). Tokens are scoped to the customer that minted them.
         */
        get: operations["aev-pollInteraction"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        __schema0: {
            field?: string | null;
            match_type?: ("is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty") | null;
            value?: unknown | null;
            tag?: {
                key?: string | null;
                match_type?: ("is" | "is_not" | "contains" | "not_contains") | null;
                value?: string | null;
            } | null;
            operand?: ("and" | "or") | null;
            filters?: components["schemas"]["__schema0"][] | null;
            comment?: string | null;
            created_by?: string | null;
            created_at?: string | null;
        };
        /**
         * Invalid input data error (400)
         * @description The error information
         * @example {
         *       "code": "BAD_REQUEST",
         *       "message": "Invalid input data",
         *       "issues": []
         *     }
         */
        "error.BAD_REQUEST": {
            /**
             * @description The error message
             * @example Invalid input data
             */
            message: string;
            /**
             * @description The error code
             * @example BAD_REQUEST
             */
            code: string;
            /**
             * @description An array of issues that were responsible for the error
             * @example []
             */
            issues?: {
                message: string;
            }[];
        };
        /**
         * Authorization not provided error (401)
         * @description The error information
         * @example {
         *       "code": "UNAUTHORIZED",
         *       "message": "Authorization not provided",
         *       "issues": []
         *     }
         */
        "error.UNAUTHORIZED": {
            /**
             * @description The error message
             * @example Authorization not provided
             */
            message: string;
            /**
             * @description The error code
             * @example UNAUTHORIZED
             */
            code: string;
            /**
             * @description An array of issues that were responsible for the error
             * @example []
             */
            issues?: {
                message: string;
            }[];
        };
        /**
         * Insufficient access error (403)
         * @description The error information
         * @example {
         *       "code": "FORBIDDEN",
         *       "message": "Insufficient access",
         *       "issues": []
         *     }
         */
        "error.FORBIDDEN": {
            /**
             * @description The error message
             * @example Insufficient access
             */
            message: string;
            /**
             * @description The error code
             * @example FORBIDDEN
             */
            code: string;
            /**
             * @description An array of issues that were responsible for the error
             * @example []
             */
            issues?: {
                message: string;
            }[];
        };
        /**
         * Not found error (404)
         * @description The error information
         * @example {
         *       "code": "NOT_FOUND",
         *       "message": "Not found",
         *       "issues": []
         *     }
         */
        "error.NOT_FOUND": {
            /**
             * @description The error message
             * @example Not found
             */
            message: string;
            /**
             * @description The error code
             * @example NOT_FOUND
             */
            code: string;
            /**
             * @description An array of issues that were responsible for the error
             * @example []
             */
            issues?: {
                message: string;
            }[];
        };
        /**
         * Internal server error error (500)
         * @description The error information
         * @example {
         *       "code": "INTERNAL_SERVER_ERROR",
         *       "message": "Internal server error",
         *       "issues": []
         *     }
         */
        "error.INTERNAL_SERVER_ERROR": {
            /**
             * @description The error message
             * @example Internal server error
             */
            message: string;
            /**
             * @description The error code
             * @example INTERNAL_SERVER_ERROR
             */
            code: string;
            /**
             * @description An array of issues that were responsible for the error
             * @example []
             */
            issues?: {
                message: string;
            }[];
        };
        __schema1: {
            name?: string;
            value?: unknown[];
            /** @enum {string} */
            match_type?: "equals" | "not_equals" | "contains" | "not_contains" | "is_null" | "is_not_null" | "greater_than" | "greater_equal" | "less_than" | "less_equal" | "matches_regex" | "mismatches_regex";
            /** @enum {string} */
            operand?: "OR" | "AND";
            attributes_list?: components["schemas"]["__schema1"][] | null;
        };
        __schema2: {
            value?: string;
            /** @enum {string} */
            match_type?: "equals" | "not_equals";
            /** @enum {string} */
            operand?: "OR" | "AND";
            actions_list?: components["schemas"]["__schema2"][];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    "auditLogs-publicList": {
        parameters: {
            query?: {
                time_from?: string;
                time_to?: string;
                action?: "create" | "update" | "delete" | "login" | "login_failed";
                entity_type?: string;
                entity_id?: string;
                status?: "success" | "failed";
                user_email?: string;
                category?: "configuration" | "security";
                page_size?: number;
                cursor?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            /** Format: date-time */
                            timestamp: string;
                            user_id: string;
                            user_email?: string;
                            customer_id?: string;
                            org_id?: string;
                            workspace_name?: string;
                            /** @enum {string} */
                            category?: "configuration" | "security";
                            entity_type: string;
                            entity_id: string;
                            /** @enum {string} */
                            action: "create" | "update" | "delete" | "login" | "login_failed";
                            /** @enum {string} */
                            status: "success" | "failed";
                            procedure_name: string;
                            source_ip?: string;
                            user_agent?: string;
                            error?: {
                                code: string;
                                message: string;
                            };
                            extracted?: unknown;
                        }[];
                        total: number;
                        next_cursor?: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "attackPaths-list": {
        parameters: {
            query?: {
                attack_path_ids?: string[];
                resource_ids?: string[];
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        description?: string;
                        severity?: number;
                        finding_types?: ("misconfiguration" | "internet_exposed" | "insecure_identity" | "vulnerability" | "high_privileges" | "privilege_escalation" | "data_access" | "crown_jewel_access" | "admin_privileges" | "external_access" | "segmentation_breach" | "hosted_secret")[];
                        violations_count?: number;
                        /** @enum {string} */
                        state?: "enabled" | "disabled" | "archived";
                    }[];
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "attackPaths-violations": {
        parameters: {
            query?: {
                attack_path_id?: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            subject_id: string;
                            first_seen_timestamp?: string | null;
                            controller_kind?: string | null;
                            member_count?: number;
                            child_resources?: {
                                subject_id: string;
                                first_seen_timestamp?: string | null;
                            }[];
                        }[];
                        total_count: number;
                        total_instance_count?: number | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "attackPaths-details": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                resource_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        paths: string[][];
                        ports?: {
                            start: number;
                            end: number;
                            protocol: string;
                        }[];
                        sources?: {
                            resource_id: string;
                            port_ranges?: {
                                start: number;
                                end: number;
                                protocol: string;
                            }[];
                        }[];
                        exposures?: {
                            kind: string;
                            port_ranges?: {
                                start: number;
                                end: number;
                                protocol: string;
                            }[];
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "canaries-list": {
        parameters: {
            query?: {
                accountId?: string[];
                activityLogs?: boolean;
                createdBy?: string[];
                phrase?: string;
                region?: string[];
                resourceId?: string[];
                resourceType?: string[];
                status?: ("active" | "disabled" | "not_deployed" | "deleted")[];
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        _id: string;
                        name: string;
                        accountId: string;
                        subscriptionId?: string;
                        resourceGroupId?: string;
                        region: string;
                        resourceType: string;
                        description?: string;
                        status: string;
                        createdBy?: string;
                        createdAt: string;
                        attackPaths?: {
                            [key: string]: number;
                        };
                        detectionsCount?: number;
                        isSandbox?: boolean;
                        hasActivityLogs?: boolean;
                        initialTags?: {
                            key: string;
                            value: string;
                        }[];
                        excludeTags?: {
                            _id: string;
                            key: string;
                            match_type: string;
                            value: string;
                            created_by?: string | null;
                            created_at?: string | null;
                        }[];
                        resourceId?: string;
                        iamRoles?: string[];
                        allowProjectVmAccess?: boolean;
                        detectionEnabled?: boolean;
                        detectionActions?: string[];
                        azureStorageAccountId?: string;
                    }[];
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "configChanges-list": {
        parameters: {
            query?: {
                resource_ids?: string[];
                resource_type?: string[];
                cloud_user_arn?: string;
                account_id?: string[];
                from_timestamp?: string;
                to_timestamp?: string;
                event_name?: string;
                region?: string[];
                action_type?: string[];
                cloud_source_ip?: string;
                user_agent?: string;
                severity?: number[];
                pageIndex?: number;
                pageSize?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            _id: string;
                            severity?: number;
                            event_name?: string;
                            timestamp?: string;
                            impact_types?: string[];
                            account_ids?: string[];
                            violations_by_violated_rules_severity?: {
                                [key: string]: number;
                            };
                            source_type?: string;
                            resource_ids?: string[];
                            cloud_user_arn?: string[];
                            cloud_source_ip?: string[];
                            resource_type?: string[];
                            action_type?: string[];
                            region?: string[];
                            user_agent?: string[];
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "configChanges-details": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        details: {
                            _id: string;
                            severity?: number;
                            event_name?: string;
                            timestamp?: string;
                            source?: {
                                type?: string;
                                metadata?: {
                                    [key: string]: unknown;
                                };
                            };
                            sub_events?: {
                                _id: string;
                                is_base?: boolean;
                                severity?: number | string;
                                action_type?: string;
                                cloud_provider?: string;
                                cloud_source_ip?: string;
                                cloud_user_arn?: string;
                                account_id?: string;
                                region?: string;
                                resource_blocks?: string[];
                                resource_ids?: string[];
                                entities?: {
                                    id: string;
                                    type?: string;
                                }[];
                                config_changes?: {
                                    resource_id: string;
                                    before?: unknown;
                                    after?: unknown;
                                }[];
                                user_agent?: string;
                                comment?: string;
                                impact_types?: string[];
                                hidden?: boolean;
                            }[];
                            impact_types?: string[];
                            account_ids?: string[];
                            violations_by_violated_rules_severity?: {
                                [key: string]: number;
                            };
                            raw_event?: unknown;
                        };
                        risks: {
                            violations: {
                                id: string;
                                name?: string;
                                description?: string;
                                severity?: number;
                            }[];
                            attackPaths: {
                                id: string;
                                name?: string;
                                description?: string;
                                severity?: number;
                                finding_types?: string[];
                            }[];
                        };
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "inventory-list": {
        parameters: {
            query?: {
                phrase?: string;
                skip?: number;
                limit?: number;
                tags?: (string | {
                    key: string;
                    value: string;
                    /** @enum {string} */
                    key_operand: "contains" | "equals";
                    /** @enum {string} */
                    value_operand: "contains" | "equals";
                })[];
                resource_id?: string[];
                associated_resource_id?: string;
                resource_type?: string[];
                account_id?: string[];
                region?: string[];
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            resource_id?: string;
                            resource_type?: string;
                            parent?: string[];
                            display_name?: string;
                            account_id?: string;
                            region?: string;
                            vpc_id?: string;
                            publicly_accessible?: boolean;
                            cloud?: string;
                            cloud_tags?: {
                                Key: string;
                                Value: string;
                            }[];
                        }[];
                        total_count: number;
                        error?: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "inventory-details": {
        parameters: {
            query: {
                resource_id: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        resource_id?: string;
                        resource_type?: string;
                        display_name?: string;
                        display_id?: string;
                        instance_type?: string;
                        availability_zones?: string[];
                        comment?: string;
                        action?: string;
                        end_action?: string;
                        cloud?: string;
                        provider?: string;
                        parent?: string[];
                        parent_type?: string;
                        account_id?: string;
                        EksId?: string;
                        raw?: unknown;
                        region?: string;
                        vpc_id?: string;
                        auto_scaling_group?: string | string[];
                        controller_id?: string;
                        controller_kind?: string;
                        cluster_id?: string;
                        cluster_type?: string;
                        namespace_id?: string;
                        deployment_id?: string;
                        container_id?: string;
                        external_ids?: string[];
                        image_repository_id?: string;
                        image_registry_id?: string;
                        image_type?: string;
                        container_images?: string[];
                        container_image_uris?: string[];
                        start_timestamp?: number;
                        end_timestamp?: number;
                        publicly_accessible?: boolean;
                        public_address?: string;
                        addresses?: string[];
                        role_arn_list?: string[];
                        associated_resource_ids?: string[];
                        tags?: {
                            Key?: string;
                            Value?: string;
                        }[];
                        cloud_tags?: {
                            Key?: string;
                            Value?: string;
                        }[];
                        deleted?: boolean;
                        is_network_endpoint?: boolean;
                        endpoint_types?: string[];
                        private_endpoint_ids?: string[];
                        reachable_vpc_list?: string[];
                        predicted_monthly_cost?: number;
                        ownerless?: boolean;
                        translated?: unknown;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "inventory-configuration": {
        parameters: {
            query: {
                resource_id: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "inventory-rawConfiguration": {
        parameters: {
            query: {
                resource_id: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "inventory-type": {
        parameters: {
            query?: {
                account_id?: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        resource_type: string;
                        count: number;
                    }[];
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "inventory-crownJewels": {
        parameters: {
            query: {
                resource_ids: string[];
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        resource_id: string;
                        /** @default  */
                        description: string;
                        resource_type: string;
                    }[];
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "inventory-resolveResourceType": {
        parameters: {
            query: {
                query: string;
                limit?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        query: string;
                        matches: {
                            resource_type: string;
                            /** @enum {string} */
                            match_kind: "exact" | "alias" | "substring" | "token";
                            score: number;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "investigator-investigate": {
        parameters: {
            query: {
                resourceType?: string;
                from_timestamp: string;
                to_timestamp: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        identityLogs?: ({
                            principal_id?: string;
                            action?: string;
                            destination?: string;
                            count?: number;
                            identity?: string;
                            last_seen?: string;
                            error_code?: string;
                            src_ip?: string;
                            src_resource_id?: string;
                            src_geo_iso?: string;
                            src_resource_type?: string;
                        } & {
                            [key: string]: unknown;
                        })[];
                        auditLogs?: ({
                            cluster_id?: string;
                            cluster_name?: string;
                            namespace?: string;
                            account_id?: string;
                            principal_id?: string;
                            principal_type?: string;
                            verb?: string;
                            resource_type?: string;
                            response_code?: number;
                            last_seen?: string;
                            count?: number;
                        } & {
                            [key: string]: unknown;
                        })[];
                        processLogs?: ({
                            parent_binary?: string;
                            binary?: string;
                            container?: string;
                            arguments?: string;
                            last_seen?: string;
                            count?: number;
                        } & {
                            [key: string]: unknown;
                        })[];
                        indirect_events?: ({
                            _id: string;
                            timestamp?: string;
                            cloud_user_arn?: string;
                            event_name?: string;
                            resource_id?: string;
                            violated_rules?: ({
                                id: string;
                                severity: string | number;
                                name: string;
                            } & {
                                [key: string]: unknown;
                            })[];
                        } & {
                            [key: string]: unknown;
                        })[];
                        credentials?: ({
                            src_resource_id: string;
                        } & {
                            [key: string]: unknown;
                        })[];
                        internetIngressPorts?: ({
                            action?: string;
                            count?: number;
                            last_seen?: string;
                            dst_port?: number;
                            traffic_sum?: string;
                        } & {
                            [key: string]: unknown;
                        })[];
                        resourceFlowlogs?: ({
                            action?: string;
                            count?: number;
                            dst_resource_id?: string;
                            dst_resource_type?: string;
                            last_seen?: string;
                            src_resource_id?: string;
                            src_resource_type?: string;
                            traffic_sum?: string;
                            container?: string;
                            application_name?: string;
                            dst_dns_names?: string;
                        } & {
                            [key: string]: unknown;
                        })[];
                        resourceApiLogs?: ({
                            host_resource_id?: string;
                            host_resource_type?: string;
                            container?: string;
                            binary?: string;
                            http_host?: string;
                            count?: number;
                            last_seen?: string;
                        } & {
                            [key: string]: unknown;
                        })[];
                        events?: ({
                            _id: string;
                        } & {
                            [key: string]: unknown;
                        })[];
                        activityLogs?: {
                            [key: string]: unknown;
                        }[];
                        risks?: {
                            name: string;
                            description: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "investigator-summary": {
        parameters: {
            query: {
                resourceType?: string;
                from_timestamp: string;
                to_timestamp: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        summary: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "investigator-processLogs": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Resource ID: the pod UID, EC2/VM instance ID, etc. Provide this OR pod_name. */
                    resourceId?: string;
                    /** @description Kubernetes pod NAME (e.g. "my-app-5c5574f895-d2glz"). Use when you have the pod name rather than its UID. NOT unique: the same pod name can exist in other namespaces and clusters, so narrow with namespace and check resource_id in the results. */
                    pod_name?: string;
                    /** @description Start time (ISO 8601) */
                    from_timestamp: string;
                    /** @description End time (ISO 8601) */
                    to_timestamp: string;
                    /** @description Filter by binary name (e.g. "powershell", "cmd.exe") */
                    binary?: string;
                    /** @description Filter by parent process */
                    parent_binary?: string;
                    /** @description Filter by container name */
                    container?: string;
                    /** @description Filter by K8s namespace */
                    namespace?: string;
                    /** @default 50 */
                    limit?: number;
                    /** @default 0 */
                    skip?: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            last_seen?: string | null;
                            parent_binary?: string | null;
                            binary?: string | null;
                            container?: string | null;
                            arguments?: string | null;
                            cwd?: string | null;
                            count?: number | null;
                            resource_id?: string | null;
                            namespace?: string | null;
                            cluster_id?: string | null;
                            account_id?: string | null;
                        }[];
                        totalCount: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "investigator-fileLogs": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Resource ID: the pod UID, EC2/VM instance ID, etc. Provide this OR pod_name. */
                    resourceId?: string;
                    /** @description Kubernetes pod NAME (e.g. "my-app-5c5574f895-d2glz"). Use when you have the pod name rather than its UID. NOT unique: the same pod name can exist in other namespaces and clusters, so narrow with namespace and check resource_id in the results. */
                    pod_name?: string;
                    /** @description Start time (ISO 8601) */
                    from_timestamp: string;
                    /** @description End time (ISO 8601) */
                    to_timestamp: string;
                    /** @description Filter by file path (e.g. "/etc/passwd", "/tmp/") */
                    file_path?: string;
                    /** @description Filter by process that accessed the file */
                    binary?: string;
                    /** @description Filter by container name */
                    container?: string;
                    /** @description Filter by K8s namespace */
                    namespace?: string;
                    /** @default 50 */
                    limit?: number;
                    /** @default 0 */
                    skip?: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            last_seen?: string | null;
                            parent_binary?: string | null;
                            binary?: string | null;
                            container?: string | null;
                            function_names?: string | null;
                            file_path?: string | null;
                            count?: number | null;
                            resource_id?: string | null;
                            namespace?: string | null;
                            cluster_id?: string | null;
                            account_id?: string | null;
                            resource_type?: string | null;
                        }[];
                        totalCount: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "investigator-apiLogs": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Resource ID: the pod UID, EC2/VM instance ID, etc. Provide this OR pod_name. */
                    resourceId?: string;
                    /** @description Kubernetes pod NAME (e.g. "my-app-5c5574f895-d2glz"). Use when you have the pod name rather than its UID. NOT unique: the same pod name can exist in other namespaces and clusters, so narrow with namespace and check resource_id in the results. */
                    pod_name?: string;
                    /** @description Start time (ISO 8601) */
                    from_timestamp: string;
                    /** @description End time (ISO 8601) */
                    to_timestamp: string;
                    /** @description Filter by HTTP method (GET, POST, PUT, DELETE) */
                    http_method?: string;
                    /** @description Filter by target host */
                    http_host?: string;
                    /** @description Filter by API path */
                    http_path?: string;
                    /**
                     * @description Filter by traffic direction
                     * @enum {string}
                     */
                    direction?: "inbound" | "outbound";
                    /** @description Filter by container name */
                    container?: string;
                    /** @description Filter by K8s namespace */
                    namespace?: string;
                    /** @default 50 */
                    limit?: number;
                    /** @default 0 */
                    skip?: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            last_seen?: string | null;
                            resource_id?: string | null;
                            container?: string | null;
                            namespace?: string | null;
                            cluster_id?: string | null;
                            account_id?: string | null;
                            binary?: string | null;
                            direction?: string | null;
                            library?: string | null;
                            http_method?: string | null;
                            http_host?: string | null;
                            http_path?: string | null;
                            http_content_type?: string | null;
                            count?: number | null;
                            resource_type?: string | null;
                            dst_resource_id?: string | null;
                            dst_resource_type?: string | null;
                            dst_resource_display_name?: string | null;
                            dst_namespace?: string | null;
                            dst_dns_names?: string[] | null;
                        }[];
                        totalCount: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "integrations-kubernetes-list": {
        parameters: {
            query?: {
                cursor?: number;
                limit?: number;
                status?: ("connected" | "disconnected" | "unhealthy" | "not_deployed")[];
                accounts?: string[];
                agent_type?: ("cluster_only" | "cluster_runtime")[];
                cloud_provider?: ("eks" | "aks" | "gcp_gke_cluster")[];
                cluster_name?: string[];
                version?: string[];
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        _id: string;
                        type: string;
                        created_by?: string | null;
                        display_name?: string | null;
                        aws_region?: string | null;
                        region?: string | null;
                        eks_arn?: string | null;
                        aks_resource_id?: string | null;
                        gke_resource_id?: string | null;
                        onprem_cluster_id?: string | null;
                        collection_token?: string | null;
                        status?: string | null;
                        creation_date?: string | null;
                        full_scan_period?: number | null;
                        cloud_account_id?: string | null;
                        metrics_period?: string | null;
                        runtime_agent_enabled?: boolean | null;
                        tracing_policies?: {
                            network: boolean;
                            process: boolean;
                            files: boolean;
                            /** @default false */
                            api: boolean;
                            /** @default false */
                            response_actions: boolean;
                        } | null;
                        last_seen_at?: string | null;
                        last_metric_at?: string | null;
                        runtime_agent_deployed?: boolean | null;
                        cluster_agent_version?: string | null;
                        is_latest_version?: boolean | null;
                        latest_cluster_agent_version?: string | null;
                        unhealthy_agents_count?: number | null;
                        connected_agents_count?: number | null;
                        disconnected_agents_count?: number | null;
                        non_deployed_agents_count?: number | null;
                        nodes_count?: number | null;
                        health_reason?: string | null;
                        inInventory?: boolean | null;
                        cluster_type?: string | null;
                    }[];
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "integrations-ecs-list": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        _id: string;
                        type: string;
                        created_by?: string | null;
                        display_name?: string | null;
                        aws_region?: string | null;
                        ecs_cluster_arn?: string | null;
                        collection_token?: string | null;
                        status?: string | null;
                        creation_date?: string | null;
                        full_scan_period?: number | null;
                        cloud_account_id?: string | null;
                        metrics_period?: string | null;
                        runtime_agent_enabled?: boolean | null;
                        tracing_policies?: {
                            network: boolean;
                            process: boolean;
                            files: boolean;
                            /** @default false */
                            api: boolean;
                            /** @default false */
                            response_actions: boolean;
                        } | null;
                        last_seen_at?: string | null;
                        last_metric_at?: string | null;
                        nodes_last_seen_at?: string | null;
                        runtime_agent_deployed?: boolean | null;
                        cluster_agent_version?: string | null;
                        is_latest_version?: boolean | null;
                        latest_cluster_agent_version?: string | null;
                        unhealthy_agents_count?: number | null;
                        connected_agents_count?: number | null;
                        disconnected_agents_count?: number | null;
                        non_deployed_agents_count?: number | null;
                        response_actions_count?: number | null;
                        tasks_count?: number | null;
                        health_reason?: string | null;
                        inInventory?: boolean | null;
                        cluster_type?: string | null;
                    }[];
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "logQuery-query": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    log_type: "flow-logs" | "activity-logs" | "process-logs" | "file-logs" | "audit-logs" | "api-logs";
                    time_range: {
                        from: string;
                        to: string;
                    };
                    filters?: {
                        [key: string]: unknown;
                    };
                    group_by?: string[];
                    aggregation?: {
                        group_by: string[];
                        select: {
                            /** @enum {string} */
                            op: "count" | "max" | "min" | "sum";
                            column?: string;
                            alias: string;
                        }[];
                        order_by?: {
                            column: string;
                            /**
                             * @default desc
                             * @enum {string}
                             */
                            direction?: "asc" | "desc";
                        };
                        /** @default 100 */
                        limit?: number;
                    };
                    /** @default 100 */
                    limit?: number;
                    /** @default 0 */
                    offset?: number;
                    result_set_limit?: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "logQuery-queryStatus": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    query_id: string;
                    cursor?: string;
                    limit?: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-ndrTopTalkers": {
        parameters: {
            query: {
                /** @description REQUIRED: window start (ISO 8601). The cubes are partitioned by day, so the window bounds the scan. */
                from_timestamp: string;
                /** @description REQUIRED: window end (ISO 8601), at most 35 days after from_timestamp. */
                to_timestamp: string;
                account_id?: string;
                group_by?: "workload" | "source_ip";
                measure?: "bytes" | "flows";
                traffic?: "all" | "internet_egress";
                limit?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /**
                         * @description Daily source admission limits can omit sources
                         * @constant
                         */
                        approximate: true;
                        rows: {
                            account_id: string;
                            resource_id: string;
                            resource_type: string;
                            source_ip: string;
                            label: string;
                            sum_bytes: number;
                            count_flows: number;
                            first_seen: string;
                            last_seen: string;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-ndrOverview": {
        parameters: {
            query: {
                /** @description REQUIRED: window start (ISO 8601). The cubes are partitioned by day, so the window bounds the scan. */
                from_timestamp: string;
                /** @description REQUIRED: window end (ISO 8601), at most 35 days after from_timestamp. */
                to_timestamp: string;
                account_id?: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        totals: {
                            /** @enum {string} */
                            direction_class: "ingress" | "egress" | "east_west" | "internal";
                            /** @description ACCEPT or REJECT as the flow log reported it */
                            action: string;
                            sum_bytes: number;
                            count_flows: number;
                        }[];
                        /** @description Distinct egress destinations flagged TOR or with a threat score; null for an account-scoped call, because the destination cube carries no account */
                        risky_destinations: number | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-ndrVolumeSeries": {
        parameters: {
            query: {
                /** @description REQUIRED: window start (ISO 8601). The cubes are partitioned by day, so the window bounds the scan. */
                from_timestamp: string;
                /** @description REQUIRED: window end (ISO 8601), at most 35 days after from_timestamp. */
                to_timestamp: string;
                account_id?: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description Bucket width the rows were served at: 900, 3600 or 86400 */
                        bucket_sec: number;
                        rows: {
                            /** @enum {string} */
                            direction_class: "ingress" | "egress" | "east_west" | "internal";
                            /** @description ACCEPT or REJECT as the flow log reported it */
                            action: string;
                            sum_bytes: number;
                            count_flows: number;
                            bucket: string;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-ndrExternalDestinations": {
        parameters: {
            query: {
                /** @description REQUIRED: window start (ISO 8601). The cubes are partitioned by day, so the window bounds the scan. */
                from_timestamp: string;
                /** @description REQUIRED: window end (ISO 8601), at most 35 days after from_timestamp. */
                to_timestamp: string;
                risky_only?: boolean;
                limit?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        rows: {
                            /** @description Highest-traffic representative IP when destinations are grouped by resolved name */
                            dst_ip: string;
                            /** @description Resolved name used to group destinations; empty for an unnamed IP */
                            dst_dns_name: string;
                            dst_geo_iso: string;
                            dst_is_tor: boolean;
                            dst_malicious_score: number;
                            /** @description ACCEPT or REJECT as the flow log reported it */
                            action: string;
                            sum_bytes: number;
                            count_flows: number;
                            first_seen: string;
                            last_seen: string;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-ndrIngressPorts": {
        parameters: {
            query: {
                /** @description REQUIRED: window start (ISO 8601). The cubes are partitioned by day, so the window bounds the scan. */
                from_timestamp: string;
                /** @description REQUIRED: window end (ISO 8601), at most 35 days after from_timestamp. */
                to_timestamp: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        rows: {
                            /** @description Destination port; 32768 represents the grouped high-port range */
                            dst_port: number;
                            /** @description True for the row grouping destination ports at or above 32768 per protocol. The group can include services and reply traffic; individual ports within it are not shown. */
                            high_port_group: boolean;
                            protocol: string;
                            accepted: number;
                            rejected: number;
                            sum_bytes: number;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-ndrGeo": {
        parameters: {
            query: {
                /** @description REQUIRED: window start (ISO 8601). The cubes are partitioned by day, so the window bounds the scan. */
                from_timestamp: string;
                /** @description REQUIRED: window end (ISO 8601), at most 35 days after from_timestamp. */
                to_timestamp: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        rows: {
                            geo_iso: string;
                            /** @enum {string} */
                            direction_class: "ingress" | "egress" | "east_west" | "internal";
                            /** @description ACCEPT or REJECT as the flow log reported it */
                            action: string;
                            sum_bytes: number;
                            count_flows: number;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-ndrRejectedSources": {
        parameters: {
            query: {
                /** @description REQUIRED: window start (ISO 8601). The cubes are partitioned by day, so the window bounds the scan. */
                from_timestamp: string;
                /** @description REQUIRED: window end (ISO 8601), at most 35 days after from_timestamp. */
                to_timestamp: string;
                account_id?: string;
                limit?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        rows: {
                            /** @description Resource id, or the address for an internet source */
                            src_resource_id: string;
                            src_resource_type: string;
                            /** @description The account the source belongs to, or hit if it is internet */
                            account_id: string;
                            count_flows: number;
                            /** @description Destination ports the source was rejected on most, up to five */
                            ports: number[];
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-trafficLogs": {
        parameters: {
            query?: {
                skip?: number;
                limit?: number;
                src_ip?: string;
                dst_ip?: string;
                src_resource_id?: string;
                dst_resource_id?: string;
                protocol?: string[];
                src_geo_iso?: string[];
                dst_geo_iso?: string[];
                src_port_range?: string | {
                    gte: number;
                    lte: number;
                };
                dst_port_range?: string | {
                    gte: number;
                    lte: number;
                };
                action?: ("ACCEPT" | "REJECT" | "UNKNOWN")[];
                src_account_id?: string[];
                dst_account_id?: string[];
                src_region?: string[];
                dst_region?: string[];
                from_timestamp?: "" | string;
                to_timestamp?: "" | string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: unknown[];
                        /** @description Total matching rows, capped at the 10,000-row result window. A value of 10000 means at least 10,000 matched. */
                        totalCount: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-trafficGraph": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    src_account_id?: string[];
                    dst_account_id?: string[];
                    src_region?: string[];
                    dst_region?: string[];
                    src_cluster_id?: string[];
                    dst_cluster_id?: string[];
                    src_namespace?: string[];
                    dst_namespace?: string[];
                    src_vpc_id?: string[];
                    dst_vpc_id?: string[];
                    src_resource_type?: string[];
                    dst_resource_type?: string[];
                    src_resource_id?: string[];
                    dst_resource_id?: string[];
                    src_tags?: {
                        key: string;
                        value: string;
                    }[];
                    dst_tags?: {
                        key: string;
                        value: string;
                    }[];
                    /** @description Runtime-map account filter. Matches when either endpoint belongs to one of the selected accounts. */
                    account_ids?: string[];
                    /** @description Runtime-map hierarchy scope for a resource-type group. Kept separate from directional user filters. */
                    drilldown_resource_type?: string;
                    /** @description Resource-leaf hierarchy ownership. When present, directional location filters only constrain their respective endpoints. */
                    drilldown_scope?: {
                        cluster_id?: string;
                        namespace?: string;
                        region?: string;
                        vpc_id?: string;
                        parent?: string;
                    };
                    src_parent?: string[];
                    dst_parent?: string[];
                    /** @description Match flows where this resource appears as either source or destination. Forwarded to ms_paths as top-level resource_id. */
                    intermediate_resource_id?: string;
                    /**
                     * @description Runtime-map provider drilldown. When set, the server returns per-account rows scoped to this provider (no initial-state rollup).
                     * @enum {string}
                     */
                    drilldown_provider?: "aws" | "azure" | "gcp" | "other";
                    /** @description Runtime-map account drilldown. When set, the server returns resource-type group rows + cluster placeholder rows + inter-group edges scoped to this account. */
                    drilldown_account?: string;
                    /** @description REQUIRED: first UTC calendar day (YYYY-MM-DD). The runtime-map rollup does not store sub-day timestamps. */
                    from_timestamp: string;
                    /** @description REQUIRED: last UTC calendar day (YYYY-MM-DD), inclusive. The range from from_timestamp must contain 1-7 days. */
                    to_timestamp: string;
                    /** @enum {string} */
                    aggregate_by: "category" | "resource_type" | "account" | "region" | "vpc" | "az" | "namespace" | "cluster_id" | "dns_names" | "ip" | "default";
                    /** @default 100 */
                    size?: number;
                    /** @description Pass null for the first complete-result page, then nextCursor until null. Omit for the legacy top-N view. */
                    cursor?: string | null;
                    /**
                     * @default traffic_sum
                     * @enum {string}
                     */
                    sort_by?: "traffic_sum" | "last_seen";
                    /**
                     * @default desc
                     * @enum {string}
                     */
                    sort_order?: "asc" | "desc";
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: unknown[];
                        totalCount: number;
                        /** @default false */
                        truncated: boolean;
                        nextCursor?: string | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-k8sAuditLogs": {
        parameters: {
            query?: {
                skip?: number;
                limit?: number;
                cluster_id?: string;
                account_id?: string[];
                verb?: string;
                principal_id?: string;
                principal_type?: string[];
                resource_type?: string[];
                namespace?: string;
                from_timestamp?: "" | string;
                from_timesatmp?: "" | string;
                to_timestamp?: "" | string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: unknown[];
                        /** @description Total matching rows, capped at the 10,000-row result window. A value of 10000 means at least 10,000 matched. */
                        totalCount: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-identityLogs": {
        parameters: {
            query?: {
                src_ip?: string;
                identity?: string;
                principal_type?: string[];
                cloud_type?: string[];
                action?: string;
                region?: string[];
                destination?: string;
                activity_resource_id?: string;
                user_agent?: string;
                error_message?: string;
                account_id?: string[];
                src_resource_id?: string;
                src_resource_type?: string[];
                src_geo_iso?: string[];
                src_display_name?: string;
                src_nic_id?: string;
                src_is_tor?: boolean;
                src_ip_score?: number[];
                dst_type?: ("s3_bucket" | "dynamodb_table" | "iam_role")[];
                aggregate_by?: "default";
                principal_id?: string;
                session_id?: string;
                new_session_id?: string;
                from_timestamp?: "" | string;
                from_timesatmp?: "" | string;
                to_timestamp?: "" | string;
                skip?: number;
                limit?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: unknown[];
                        /** @description Total matching rows, capped at the 10,000-row result window. A value of 10000 means at least 10,000 matched. */
                        totalCount: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-processLogs": {
        parameters: {
            query?: {
                skip?: number;
                limit?: number;
                from_timestamp?: string;
                to_timestamp?: string;
                resource_id?: string;
                pod_name?: string;
                binary?: string;
                parent_binary?: string;
                arguments?: string;
                container?: string;
                namespace?: string[];
                cluster_id?: string[];
                account_id?: string[];
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: unknown[];
                        totalCount: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-fileLogs": {
        parameters: {
            query?: {
                skip?: number;
                limit?: number;
                from_timestamp?: string;
                to_timestamp?: string;
                resource_id?: string;
                pod_name?: string;
                file_path?: string;
                binary?: string;
                function_names?: string;
                container?: string;
                namespace?: string[];
                cluster_id?: string[];
                account_id?: string[];
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: unknown[];
                        totalCount: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "network-apiLogs": {
        parameters: {
            query?: {
                skip?: number;
                limit?: number;
                from_timestamp?: string;
                to_timestamp?: string;
                resource_id?: string;
                pod_name?: string;
                http_method?: string;
                http_host?: string;
                http_path?: string;
                direction?: string;
                container?: string;
                namespace?: string[];
                cluster_id?: string[];
                account_id?: string[];
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: unknown[];
                        totalCount: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "notifications-list": {
        parameters: {
            query?: {
                event_types?: ("cloud_event" | "detection" | "simulation_event" | "auto_remediation" | "response")[];
                statuses?: ("active" | "inactive")[];
                destinations?: string[];
                severities?: ("low" | "medium" | "high" | "critical")[];
                search?: string;
                limit?: number;
                cursor?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: {
                            id: string;
                            name: string;
                            description?: string | null;
                            enabled: boolean;
                            /** @enum {string} */
                            event_type: "cloud_event" | "detection" | "simulation_event" | "auto_remediation" | "response";
                            channels?: {
                                type: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                                subtype?: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                                id?: string;
                                recipients?: string[];
                            }[] | null;
                            condition?: {
                                main_filter?: {
                                    /** @enum {string} */
                                    operand: "and" | "or";
                                    filters?: {
                                        field?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                        value?: unknown;
                                        tag?: {
                                            key?: string;
                                            /** @enum {string} */
                                            match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                            value?: string;
                                        };
                                        /** @enum {string} */
                                        operand?: "and" | "or";
                                        filters?: {
                                            field?: string;
                                            /** @enum {string} */
                                            match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                            value?: unknown;
                                            tag?: {
                                                key?: string;
                                                /** @enum {string} */
                                                match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                                value?: string;
                                            };
                                        }[];
                                        comment?: string | null;
                                        created_by?: string | null;
                                        created_at?: string | null;
                                    }[];
                                };
                            } | null;
                            ticket_action?: {
                                integration_id: string;
                                /** @enum {string} */
                                ticket_system_type: "jira" | "azure" | "youtrack" | "service_now";
                                project?: string | null;
                                issue_type?: string | null;
                                assignee_id?: string | null;
                                assignment_group?: string | null;
                                assigned_to?: string | null;
                                custom_fields?: {
                                    [key: string]: unknown;
                                }[] | null;
                            } | null;
                            case_action?: {
                                assignee_id?: string | null;
                                /** @default user */
                                assignee_type: string;
                                /** @default auto */
                                severity: number | "auto";
                                /**
                                 * @default auto
                                 * @enum {string}
                                 */
                                priority: "auto" | "low" | "medium" | "high" | "critical";
                                playbook_template_id?: string | null;
                                sla_response_hours?: number | null;
                                sla_resolution_hours?: number | null;
                                tags?: string[] | null;
                            } | null;
                            created_by?: string | null;
                            created_at?: string | null;
                            modified_at?: string | null;
                            customer_id?: string;
                        }[];
                        total: number;
                        totalUnfiltered: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "notifications-create": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Rule name. Max 100 characters. */
                    name: string;
                    /** @description Rule description. Max 250 characters. */
                    description?: string;
                    /** @default true */
                    enabled?: boolean;
                    /** @enum {string} */
                    event_type: "cloud_event" | "detection" | "simulation_event" | "auto_remediation" | "response";
                    channels?: {
                        type: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                        subtype?: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                        id?: string;
                        recipients?: string[];
                    }[];
                    condition?: {
                        main_filter?: {
                            /** @enum {string} */
                            operand: "and" | "or";
                            filters?: {
                                field?: string;
                                /** @enum {string} */
                                match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                value?: unknown;
                                tag?: {
                                    key?: string;
                                    /** @enum {string} */
                                    match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                    value?: string;
                                };
                                /** @enum {string} */
                                operand?: "and" | "or";
                                filters?: {
                                    field?: string;
                                    /** @enum {string} */
                                    match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                    value?: unknown;
                                    tag?: {
                                        key?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                        value?: string;
                                    };
                                }[];
                                comment?: string | null;
                                created_by?: string | null;
                                created_at?: string | null;
                            }[];
                        };
                    };
                    ticket_action?: {
                        integration_id: string;
                        /** @enum {string} */
                        ticket_system_type: "jira" | "azure" | "youtrack" | "service_now";
                        project?: string | null;
                        issue_type?: string | null;
                        assignee_id?: string | null;
                        assignment_group?: string | null;
                        assigned_to?: string | null;
                        custom_fields?: {
                            [key: string]: unknown;
                        }[] | null;
                    } | null;
                    case_action?: {
                        assignee_id?: string | null;
                        /** @default user */
                        assignee_type?: string;
                        /** @default auto */
                        severity?: number | "auto";
                        /**
                         * @default auto
                         * @enum {string}
                         */
                        priority?: "auto" | "low" | "medium" | "high" | "critical";
                        playbook_template_id?: string | null;
                        sla_response_hours?: number | null;
                        sla_resolution_hours?: number | null;
                        tags?: string[] | null;
                    } | null;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        name: string;
                        description?: string | null;
                        enabled: boolean;
                        /** @enum {string} */
                        event_type: "cloud_event" | "detection" | "simulation_event" | "auto_remediation" | "response";
                        channels?: {
                            type: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                            subtype?: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                            id?: string;
                            recipients?: string[];
                        }[] | null;
                        condition?: {
                            main_filter?: {
                                /** @enum {string} */
                                operand: "and" | "or";
                                filters?: {
                                    field?: string;
                                    /** @enum {string} */
                                    match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                    value?: unknown;
                                    tag?: {
                                        key?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                        value?: string;
                                    };
                                    /** @enum {string} */
                                    operand?: "and" | "or";
                                    filters?: {
                                        field?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                        value?: unknown;
                                        tag?: {
                                            key?: string;
                                            /** @enum {string} */
                                            match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                            value?: string;
                                        };
                                    }[];
                                    comment?: string | null;
                                    created_by?: string | null;
                                    created_at?: string | null;
                                }[];
                            };
                        } | null;
                        ticket_action?: {
                            integration_id: string;
                            /** @enum {string} */
                            ticket_system_type: "jira" | "azure" | "youtrack" | "service_now";
                            project?: string | null;
                            issue_type?: string | null;
                            assignee_id?: string | null;
                            assignment_group?: string | null;
                            assigned_to?: string | null;
                            custom_fields?: {
                                [key: string]: unknown;
                            }[] | null;
                        } | null;
                        case_action?: {
                            assignee_id?: string | null;
                            /** @default user */
                            assignee_type: string;
                            /** @default auto */
                            severity: number | "auto";
                            /**
                             * @default auto
                             * @enum {string}
                             */
                            priority: "auto" | "low" | "medium" | "high" | "critical";
                            playbook_template_id?: string | null;
                            sla_response_hours?: number | null;
                            sla_resolution_hours?: number | null;
                            tags?: string[] | null;
                        } | null;
                        created_by?: string | null;
                        created_at?: string | null;
                        modified_at?: string | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "notifications-get": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        name: string;
                        description?: string | null;
                        enabled: boolean;
                        /** @enum {string} */
                        event_type: "cloud_event" | "detection" | "simulation_event" | "auto_remediation" | "response";
                        channels?: {
                            type: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                            subtype?: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                            id?: string;
                            recipients?: string[];
                        }[] | null;
                        condition?: {
                            main_filter?: {
                                /** @enum {string} */
                                operand: "and" | "or";
                                filters?: {
                                    field?: string;
                                    /** @enum {string} */
                                    match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                    value?: unknown;
                                    tag?: {
                                        key?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                        value?: string;
                                    };
                                    /** @enum {string} */
                                    operand?: "and" | "or";
                                    filters?: {
                                        field?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                        value?: unknown;
                                        tag?: {
                                            key?: string;
                                            /** @enum {string} */
                                            match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                            value?: string;
                                        };
                                    }[];
                                    comment?: string | null;
                                    created_by?: string | null;
                                    created_at?: string | null;
                                }[];
                            };
                        } | null;
                        ticket_action?: {
                            integration_id: string;
                            /** @enum {string} */
                            ticket_system_type: "jira" | "azure" | "youtrack" | "service_now";
                            project?: string | null;
                            issue_type?: string | null;
                            assignee_id?: string | null;
                            assignment_group?: string | null;
                            assigned_to?: string | null;
                            custom_fields?: {
                                [key: string]: unknown;
                            }[] | null;
                        } | null;
                        case_action?: {
                            assignee_id?: string | null;
                            /** @default user */
                            assignee_type: string;
                            /** @default auto */
                            severity: number | "auto";
                            /**
                             * @default auto
                             * @enum {string}
                             */
                            priority: "auto" | "low" | "medium" | "high" | "critical";
                            playbook_template_id?: string | null;
                            sla_response_hours?: number | null;
                            sla_resolution_hours?: number | null;
                            tags?: string[] | null;
                        } | null;
                        created_by?: string | null;
                        created_at?: string | null;
                        modified_at?: string | null;
                        customer_id?: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "notifications-delete": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "notifications-update": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Rule name. Max 100 characters. */
                    name?: string;
                    /** @description Rule description. Max 250 characters. */
                    description?: string;
                    enabled?: boolean;
                    /** @enum {string} */
                    event_type?: "cloud_event" | "detection" | "simulation_event" | "auto_remediation" | "response";
                    channels?: {
                        type: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                        subtype?: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                        id?: string;
                        recipients?: string[];
                    }[];
                    condition?: {
                        main_filter?: {
                            /** @enum {string} */
                            operand: "and" | "or";
                            filters?: {
                                field?: string;
                                /** @enum {string} */
                                match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                value?: unknown;
                                tag?: {
                                    key?: string;
                                    /** @enum {string} */
                                    match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                    value?: string;
                                };
                                /** @enum {string} */
                                operand?: "and" | "or";
                                filters?: {
                                    field?: string;
                                    /** @enum {string} */
                                    match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                    value?: unknown;
                                    tag?: {
                                        key?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                        value?: string;
                                    };
                                }[];
                                comment?: string | null;
                                created_by?: string | null;
                                created_at?: string | null;
                            }[];
                        };
                    };
                    ticket_action?: {
                        integration_id: string;
                        /** @enum {string} */
                        ticket_system_type: "jira" | "azure" | "youtrack" | "service_now";
                        project?: string | null;
                        issue_type?: string | null;
                        assignee_id?: string | null;
                        assignment_group?: string | null;
                        assigned_to?: string | null;
                        custom_fields?: {
                            [key: string]: unknown;
                        }[] | null;
                    } | null;
                    case_action?: {
                        assignee_id?: string | null;
                        /** @default user */
                        assignee_type?: string;
                        /** @default auto */
                        severity?: number | "auto";
                        /**
                         * @default auto
                         * @enum {string}
                         */
                        priority?: "auto" | "low" | "medium" | "high" | "critical";
                        playbook_template_id?: string | null;
                        sla_response_hours?: number | null;
                        sla_resolution_hours?: number | null;
                        tags?: string[] | null;
                    } | null;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        name: string;
                        description?: string | null;
                        enabled: boolean;
                        /** @enum {string} */
                        event_type: "cloud_event" | "detection" | "simulation_event" | "auto_remediation" | "response";
                        channels?: {
                            type: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                            subtype?: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                            id?: string;
                            recipients?: string[];
                        }[] | null;
                        condition?: {
                            main_filter?: {
                                /** @enum {string} */
                                operand: "and" | "or";
                                filters?: {
                                    field?: string;
                                    /** @enum {string} */
                                    match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                    value?: unknown;
                                    tag?: {
                                        key?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                        value?: string;
                                    };
                                    /** @enum {string} */
                                    operand?: "and" | "or";
                                    filters?: {
                                        field?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                        value?: unknown;
                                        tag?: {
                                            key?: string;
                                            /** @enum {string} */
                                            match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                            value?: string;
                                        };
                                    }[];
                                    comment?: string | null;
                                    created_by?: string | null;
                                    created_at?: string | null;
                                }[];
                            };
                        } | null;
                        ticket_action?: {
                            integration_id: string;
                            /** @enum {string} */
                            ticket_system_type: "jira" | "azure" | "youtrack" | "service_now";
                            project?: string | null;
                            issue_type?: string | null;
                            assignee_id?: string | null;
                            assignment_group?: string | null;
                            assigned_to?: string | null;
                            custom_fields?: {
                                [key: string]: unknown;
                            }[] | null;
                        } | null;
                        case_action?: {
                            assignee_id?: string | null;
                            /** @default user */
                            assignee_type: string;
                            /** @default auto */
                            severity: number | "auto";
                            /**
                             * @default auto
                             * @enum {string}
                             */
                            priority: "auto" | "low" | "medium" | "high" | "critical";
                            playbook_template_id?: string | null;
                            sla_response_hours?: number | null;
                            sla_resolution_hours?: number | null;
                            tags?: string[] | null;
                        } | null;
                        created_by?: string | null;
                        created_at?: string | null;
                        modified_at?: string | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-agents-list": {
        parameters: {
            query?: {
                search?: string;
                status?: "idle" | "running" | "paused" | "failed";
                template_type?: "custom";
                limit?: number;
                cursor?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: {
                            id: string;
                            customer_id: string;
                            name: string;
                            description?: string | null;
                            template_type: string;
                            /** @enum {string} */
                            status: "idle" | "running" | "paused" | "failed";
                            model_id: string;
                            system_prompt: string;
                            /**
                             * @default findings
                             * @enum {string}
                             */
                            output_mode: "findings" | "report";
                            pipeline_config: {
                                name: string;
                                type: string;
                                config?: {
                                    [key: string]: unknown;
                                };
                            }[];
                            trigger_config: ({
                                /** @constant */
                                type: "schedule";
                                cron: string;
                                /** @default UTC */
                                timezone: string;
                            } | {
                                /** @constant */
                                type: "event";
                                /** @enum {string} */
                                event_type?: "detection" | "cloud_event" | "simulation_event";
                                /** @default [] */
                                severities: string[];
                                /** @default [] */
                                conditions: {
                                    field: string;
                                    operator: string;
                                    /** @default [] */
                                    values: string[];
                                }[];
                            })[];
                            action_config: {
                                /** @constant */
                                type: "chain";
                                target_agent_id: string;
                                /**
                                 * @default any_finding
                                 * @enum {string}
                                 */
                                condition: "any_finding" | "critical_only" | "high_and_above" | "llm_eval";
                                condition_prompt?: string;
                                /** @enum {string} */
                                min_severity?: "critical" | "high" | "medium" | "low" | "info";
                                require_findings?: boolean;
                                require_approval?: boolean;
                            }[];
                            target_scope: {
                                /** @default false */
                                all_accounts: boolean;
                                account_ids?: string[];
                                /** @default false */
                                all_resource_types: boolean;
                                resource_types?: string[];
                                /** @default false */
                                all_regions: boolean;
                                regions?: string[];
                            };
                            execution_pipeline?: {
                                steps: string[];
                                compiled_system_prompt: string;
                                data_sources: string[];
                                /** @enum {string} */
                                output_mode?: "findings" | "report";
                                compiled_at: string;
                                source_hash: string;
                                step_configs?: {
                                    name: string;
                                    focus?: string;
                                    tool_groups: string[];
                                    action_binding_ids?: string[];
                                    depends_on: number[];
                                    sub_prompt: string;
                                    autoApprove?: boolean;
                                    /**
                                     * @default normal
                                     * @enum {string}
                                     */
                                    type: "normal" | "foreach" | "invoke" | "conditional";
                                    source_step_index?: number;
                                    per_item_sub_prompt?: string;
                                    target_agent_id?: string;
                                    condition_prompt?: string;
                                    if_true_steps?: number[];
                                    if_false_steps?: number[];
                                }[] | null;
                            } | null;
                            /** @default false */
                            web_search_enabled: boolean;
                            /** @default false */
                            require_approval: boolean;
                            /** @default [] */
                            allowed_tool_groups: string[];
                            /** @default [] */
                            plugin_reauth_pending: {
                                plugin_id: string;
                                operation_id: string;
                                reason: string;
                            }[];
                            /** @default [] */
                            action_bindings: {
                                id: string;
                                integration: string;
                                action_key: string;
                                display_name: string;
                                /** @default {} */
                                bound_params: {
                                    [key: string]: unknown;
                                };
                                /** @default [] */
                                customized_field_specs: {
                                    field_key: string;
                                    field_name?: string;
                                    field_type?: string;
                                    /** @default false */
                                    required: boolean;
                                    allowed_values?: {
                                        value?: string;
                                        id?: string;
                                        name?: string;
                                    }[];
                                }[];
                                /** @default [] */
                                omit_llm_params: string[];
                                webhook_body?: {
                                    key: string;
                                    /** @enum {string} */
                                    kind: "value" | "object" | "array";
                                    value?: unknown;
                                    pinned?: boolean;
                                }[];
                            }[];
                            response_tool_scope?: {
                                cloud?: {
                                    /** @default false */
                                    allow_all: boolean;
                                    /** @default [] */
                                    response_action_allowlist: string[];
                                    /** @default [] */
                                    account_allowlist: string[];
                                    /** @default [] */
                                    resource_tag_allowlist: {
                                        key: string;
                                        value?: string;
                                    }[];
                                };
                                runtime?: {
                                    /** @default false */
                                    allow_all: boolean;
                                    /** @default [] */
                                    allowed_action_types: string[];
                                    /** @default [] */
                                    provider_allowlist: string[];
                                    /** @default [] */
                                    account_allowlist: string[];
                                    /** @default [] */
                                    cluster_allowlist: string[];
                                };
                            } | null;
                            /** @default [] */
                            tags: string[];
                            /** @default true */
                            dedup_findings: boolean;
                            /** @default false */
                            require_approval_all_actions: boolean;
                            /** @default [] */
                            approval_required_tools: string[];
                            icon?: string | null;
                            created_by?: string | null;
                            created_by_name?: string | null;
                            created_by_email?: string | null;
                            /**
                             * @default current
                             * @enum {string}
                             */
                            engine_mode: "current" | "next" | "compare";
                            sub_agent_model?: string | null;
                            runagent_fastpath?: boolean | null;
                            expose_prior_triage?: boolean | null;
                            created_at: string;
                            updated_at: string;
                            /** @default 0 */
                            total_runs: number;
                            /** @default 0 */
                            success_rate: number;
                            last_run_at?: string | null;
                            avg_duration_ms?: number | null;
                            avg_cost?: number | null;
                            max_severity_24h?: ("critical" | "high" | "medium" | "low" | "info") | null;
                            /** @default 0 */
                            open_findings: number;
                        }[];
                        total: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-agents-create": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Max 100 characters. */
                    name: string;
                    /** @description Max 500 characters. */
                    description?: string;
                    /** @enum {string} */
                    template_type: "custom";
                    model_id: string;
                    system_prompt: string;
                    /**
                     * @default findings
                     * @enum {string}
                     */
                    output_mode?: "findings" | "report";
                    /** @default false */
                    web_search_enabled?: boolean;
                    pipeline_config: {
                        name: string;
                        type: string;
                        config?: {
                            [key: string]: unknown;
                        };
                    }[];
                    /** @default [] */
                    trigger_config?: ({
                        /** @constant */
                        type: "schedule";
                        cron: string;
                        /** @default UTC */
                        timezone?: string;
                    } | {
                        /** @constant */
                        type: "event";
                        /** @enum {string} */
                        event_type?: "detection" | "cloud_event" | "simulation_event";
                        /** @default [] */
                        severities?: string[];
                        /** @default [] */
                        conditions?: {
                            field: string;
                            operator: string;
                            /** @default [] */
                            values?: string[];
                        }[];
                    })[];
                    /** @default [] */
                    action_config?: {
                        /** @constant */
                        type: "chain";
                        target_agent_id: string;
                        /**
                         * @default any_finding
                         * @enum {string}
                         */
                        condition?: "any_finding" | "critical_only" | "high_and_above" | "llm_eval";
                        condition_prompt?: string;
                        /** @enum {string} */
                        min_severity?: "critical" | "high" | "medium" | "low" | "info";
                        require_findings?: boolean;
                        require_approval?: boolean;
                    }[];
                    target_scope: {
                        /** @default false */
                        all_accounts?: boolean;
                        account_ids?: string[];
                        /** @default false */
                        all_resource_types?: boolean;
                        resource_types?: string[];
                        /** @default false */
                        all_regions?: boolean;
                        regions?: string[];
                    };
                    icon?: string;
                    /** @default false */
                    require_approval?: boolean;
                    /** @default [] */
                    allowed_tool_groups?: string[];
                    /** @default [] */
                    action_bindings?: {
                        id: string;
                        integration: string;
                        action_key: string;
                        display_name: string;
                        /** @default {} */
                        bound_params?: {
                            [key: string]: unknown;
                        };
                        /** @default [] */
                        customized_field_specs?: {
                            field_key: string;
                            field_name?: string;
                            field_type?: string;
                            /** @default false */
                            required?: boolean;
                            allowed_values?: {
                                value?: string;
                                id?: string;
                                name?: string;
                            }[];
                        }[];
                        /** @default [] */
                        omit_llm_params?: string[];
                        webhook_body?: {
                            key: string;
                            /** @enum {string} */
                            kind: "value" | "object" | "array";
                            value?: unknown;
                            pinned?: boolean;
                        }[];
                    }[];
                    response_tool_scope?: {
                        cloud?: {
                            /** @default false */
                            allow_all?: boolean;
                            /** @default [] */
                            response_action_allowlist?: string[];
                            /** @default [] */
                            account_allowlist?: string[];
                            /** @default [] */
                            resource_tag_allowlist?: {
                                key: string;
                                value?: string;
                            }[];
                        };
                        runtime?: {
                            /** @default false */
                            allow_all?: boolean;
                            /** @default [] */
                            allowed_action_types?: string[];
                            /** @default [] */
                            provider_allowlist?: string[];
                            /** @default [] */
                            account_allowlist?: string[];
                            /** @default [] */
                            cluster_allowlist?: string[];
                        };
                    } | null;
                    /** @default [] */
                    tags?: string[];
                    /** @default true */
                    dedup_findings?: boolean;
                    /**
                     * @default current
                     * @enum {string}
                     */
                    engine_mode?: "current" | "next" | "compare";
                    sub_agent_model?: string;
                    runagent_fastpath?: boolean;
                    expose_prior_triage?: boolean;
                    /** @default false */
                    require_approval_all_actions?: boolean;
                    /** @default [] */
                    approval_required_tools?: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        customer_id: string;
                        name: string;
                        description?: string | null;
                        template_type: string;
                        /** @enum {string} */
                        status: "idle" | "running" | "paused" | "failed";
                        model_id: string;
                        system_prompt: string;
                        /**
                         * @default findings
                         * @enum {string}
                         */
                        output_mode: "findings" | "report";
                        pipeline_config: {
                            name: string;
                            type: string;
                            config?: {
                                [key: string]: unknown;
                            };
                        }[];
                        trigger_config: ({
                            /** @constant */
                            type: "schedule";
                            cron: string;
                            /** @default UTC */
                            timezone: string;
                        } | {
                            /** @constant */
                            type: "event";
                            /** @enum {string} */
                            event_type?: "detection" | "cloud_event" | "simulation_event";
                            /** @default [] */
                            severities: string[];
                            /** @default [] */
                            conditions: {
                                field: string;
                                operator: string;
                                /** @default [] */
                                values: string[];
                            }[];
                        })[];
                        action_config: {
                            /** @constant */
                            type: "chain";
                            target_agent_id: string;
                            /**
                             * @default any_finding
                             * @enum {string}
                             */
                            condition: "any_finding" | "critical_only" | "high_and_above" | "llm_eval";
                            condition_prompt?: string;
                            /** @enum {string} */
                            min_severity?: "critical" | "high" | "medium" | "low" | "info";
                            require_findings?: boolean;
                            require_approval?: boolean;
                        }[];
                        target_scope: {
                            /** @default false */
                            all_accounts: boolean;
                            account_ids?: string[];
                            /** @default false */
                            all_resource_types: boolean;
                            resource_types?: string[];
                            /** @default false */
                            all_regions: boolean;
                            regions?: string[];
                        };
                        execution_pipeline?: {
                            steps: string[];
                            compiled_system_prompt: string;
                            data_sources: string[];
                            /** @enum {string} */
                            output_mode?: "findings" | "report";
                            compiled_at: string;
                            source_hash: string;
                            step_configs?: {
                                name: string;
                                focus?: string;
                                tool_groups: string[];
                                action_binding_ids?: string[];
                                depends_on: number[];
                                sub_prompt: string;
                                autoApprove?: boolean;
                                /**
                                 * @default normal
                                 * @enum {string}
                                 */
                                type: "normal" | "foreach" | "invoke" | "conditional";
                                source_step_index?: number;
                                per_item_sub_prompt?: string;
                                target_agent_id?: string;
                                condition_prompt?: string;
                                if_true_steps?: number[];
                                if_false_steps?: number[];
                            }[] | null;
                        } | null;
                        /** @default false */
                        web_search_enabled: boolean;
                        /** @default false */
                        require_approval: boolean;
                        /** @default [] */
                        allowed_tool_groups: string[];
                        /** @default [] */
                        plugin_reauth_pending: {
                            plugin_id: string;
                            operation_id: string;
                            reason: string;
                        }[];
                        /** @default [] */
                        action_bindings: {
                            id: string;
                            integration: string;
                            action_key: string;
                            display_name: string;
                            /** @default {} */
                            bound_params: {
                                [key: string]: unknown;
                            };
                            /** @default [] */
                            customized_field_specs: {
                                field_key: string;
                                field_name?: string;
                                field_type?: string;
                                /** @default false */
                                required: boolean;
                                allowed_values?: {
                                    value?: string;
                                    id?: string;
                                    name?: string;
                                }[];
                            }[];
                            /** @default [] */
                            omit_llm_params: string[];
                            webhook_body?: {
                                key: string;
                                /** @enum {string} */
                                kind: "value" | "object" | "array";
                                value?: unknown;
                                pinned?: boolean;
                            }[];
                        }[];
                        response_tool_scope?: {
                            cloud?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                response_action_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                resource_tag_allowlist: {
                                    key: string;
                                    value?: string;
                                }[];
                            };
                            runtime?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                allowed_action_types: string[];
                                /** @default [] */
                                provider_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                cluster_allowlist: string[];
                            };
                        } | null;
                        /** @default [] */
                        tags: string[];
                        /** @default true */
                        dedup_findings: boolean;
                        /** @default false */
                        require_approval_all_actions: boolean;
                        /** @default [] */
                        approval_required_tools: string[];
                        icon?: string | null;
                        created_by?: string | null;
                        created_by_name?: string | null;
                        created_by_email?: string | null;
                        /**
                         * @default current
                         * @enum {string}
                         */
                        engine_mode: "current" | "next" | "compare";
                        sub_agent_model?: string | null;
                        runagent_fastpath?: boolean | null;
                        expose_prior_triage?: boolean | null;
                        created_at: string;
                        updated_at: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-agents-get": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        customer_id: string;
                        name: string;
                        description?: string | null;
                        template_type: string;
                        /** @enum {string} */
                        status: "idle" | "running" | "paused" | "failed";
                        model_id: string;
                        system_prompt: string;
                        /**
                         * @default findings
                         * @enum {string}
                         */
                        output_mode: "findings" | "report";
                        pipeline_config: {
                            name: string;
                            type: string;
                            config?: {
                                [key: string]: unknown;
                            };
                        }[];
                        trigger_config: ({
                            /** @constant */
                            type: "schedule";
                            cron: string;
                            /** @default UTC */
                            timezone: string;
                        } | {
                            /** @constant */
                            type: "event";
                            /** @enum {string} */
                            event_type?: "detection" | "cloud_event" | "simulation_event";
                            /** @default [] */
                            severities: string[];
                            /** @default [] */
                            conditions: {
                                field: string;
                                operator: string;
                                /** @default [] */
                                values: string[];
                            }[];
                        })[];
                        action_config: {
                            /** @constant */
                            type: "chain";
                            target_agent_id: string;
                            /**
                             * @default any_finding
                             * @enum {string}
                             */
                            condition: "any_finding" | "critical_only" | "high_and_above" | "llm_eval";
                            condition_prompt?: string;
                            /** @enum {string} */
                            min_severity?: "critical" | "high" | "medium" | "low" | "info";
                            require_findings?: boolean;
                            require_approval?: boolean;
                        }[];
                        target_scope: {
                            /** @default false */
                            all_accounts: boolean;
                            account_ids?: string[];
                            /** @default false */
                            all_resource_types: boolean;
                            resource_types?: string[];
                            /** @default false */
                            all_regions: boolean;
                            regions?: string[];
                        };
                        execution_pipeline?: {
                            steps: string[];
                            compiled_system_prompt: string;
                            data_sources: string[];
                            /** @enum {string} */
                            output_mode?: "findings" | "report";
                            compiled_at: string;
                            source_hash: string;
                            step_configs?: {
                                name: string;
                                focus?: string;
                                tool_groups: string[];
                                action_binding_ids?: string[];
                                depends_on: number[];
                                sub_prompt: string;
                                autoApprove?: boolean;
                                /**
                                 * @default normal
                                 * @enum {string}
                                 */
                                type: "normal" | "foreach" | "invoke" | "conditional";
                                source_step_index?: number;
                                per_item_sub_prompt?: string;
                                target_agent_id?: string;
                                condition_prompt?: string;
                                if_true_steps?: number[];
                                if_false_steps?: number[];
                            }[] | null;
                        } | null;
                        /** @default false */
                        web_search_enabled: boolean;
                        /** @default false */
                        require_approval: boolean;
                        /** @default [] */
                        allowed_tool_groups: string[];
                        /** @default [] */
                        plugin_reauth_pending: {
                            plugin_id: string;
                            operation_id: string;
                            reason: string;
                        }[];
                        /** @default [] */
                        action_bindings: {
                            id: string;
                            integration: string;
                            action_key: string;
                            display_name: string;
                            /** @default {} */
                            bound_params: {
                                [key: string]: unknown;
                            };
                            /** @default [] */
                            customized_field_specs: {
                                field_key: string;
                                field_name?: string;
                                field_type?: string;
                                /** @default false */
                                required: boolean;
                                allowed_values?: {
                                    value?: string;
                                    id?: string;
                                    name?: string;
                                }[];
                            }[];
                            /** @default [] */
                            omit_llm_params: string[];
                            webhook_body?: {
                                key: string;
                                /** @enum {string} */
                                kind: "value" | "object" | "array";
                                value?: unknown;
                                pinned?: boolean;
                            }[];
                        }[];
                        response_tool_scope?: {
                            cloud?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                response_action_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                resource_tag_allowlist: {
                                    key: string;
                                    value?: string;
                                }[];
                            };
                            runtime?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                allowed_action_types: string[];
                                /** @default [] */
                                provider_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                cluster_allowlist: string[];
                            };
                        } | null;
                        /** @default [] */
                        tags: string[];
                        /** @default true */
                        dedup_findings: boolean;
                        /** @default false */
                        require_approval_all_actions: boolean;
                        /** @default [] */
                        approval_required_tools: string[];
                        icon?: string | null;
                        created_by?: string | null;
                        created_by_name?: string | null;
                        created_by_email?: string | null;
                        /**
                         * @default current
                         * @enum {string}
                         */
                        engine_mode: "current" | "next" | "compare";
                        sub_agent_model?: string | null;
                        runagent_fastpath?: boolean | null;
                        expose_prior_triage?: boolean | null;
                        created_at: string;
                        updated_at: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-agents-delete": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-agents-update": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Max 100 characters. */
                    name?: string;
                    description?: string | null;
                    model_id?: string;
                    system_prompt?: string;
                    /** @enum {string} */
                    output_mode?: "findings" | "report";
                    web_search_enabled?: boolean;
                    pipeline_config?: {
                        name: string;
                        type: string;
                        config?: {
                            [key: string]: unknown;
                        };
                    }[];
                    trigger_config?: ({
                        /** @constant */
                        type: "schedule";
                        cron: string;
                        /** @default UTC */
                        timezone?: string;
                    } | {
                        /** @constant */
                        type: "event";
                        /** @enum {string} */
                        event_type?: "detection" | "cloud_event" | "simulation_event";
                        /** @default [] */
                        severities?: string[];
                        /** @default [] */
                        conditions?: {
                            field: string;
                            operator: string;
                            /** @default [] */
                            values?: string[];
                        }[];
                    })[];
                    action_config?: {
                        /** @constant */
                        type: "chain";
                        target_agent_id: string;
                        /**
                         * @default any_finding
                         * @enum {string}
                         */
                        condition?: "any_finding" | "critical_only" | "high_and_above" | "llm_eval";
                        condition_prompt?: string;
                        /** @enum {string} */
                        min_severity?: "critical" | "high" | "medium" | "low" | "info";
                        require_findings?: boolean;
                        require_approval?: boolean;
                    }[];
                    target_scope?: {
                        /** @default false */
                        all_accounts?: boolean;
                        account_ids?: string[];
                        /** @default false */
                        all_resource_types?: boolean;
                        resource_types?: string[];
                        /** @default false */
                        all_regions?: boolean;
                        regions?: string[];
                    };
                    icon?: string | null;
                    require_approval?: boolean;
                    allowed_tool_groups?: string[];
                    action_bindings?: {
                        id: string;
                        integration: string;
                        action_key: string;
                        display_name: string;
                        /** @default {} */
                        bound_params?: {
                            [key: string]: unknown;
                        };
                        /** @default [] */
                        customized_field_specs?: {
                            field_key: string;
                            field_name?: string;
                            field_type?: string;
                            /** @default false */
                            required?: boolean;
                            allowed_values?: {
                                value?: string;
                                id?: string;
                                name?: string;
                            }[];
                        }[];
                        /** @default [] */
                        omit_llm_params?: string[];
                        webhook_body?: {
                            key: string;
                            /** @enum {string} */
                            kind: "value" | "object" | "array";
                            value?: unknown;
                            pinned?: boolean;
                        }[];
                    }[];
                    response_tool_scope?: {
                        cloud?: {
                            /** @default false */
                            allow_all?: boolean;
                            /** @default [] */
                            response_action_allowlist?: string[];
                            /** @default [] */
                            account_allowlist?: string[];
                            /** @default [] */
                            resource_tag_allowlist?: {
                                key: string;
                                value?: string;
                            }[];
                        };
                        runtime?: {
                            /** @default false */
                            allow_all?: boolean;
                            /** @default [] */
                            allowed_action_types?: string[];
                            /** @default [] */
                            provider_allowlist?: string[];
                            /** @default [] */
                            account_allowlist?: string[];
                            /** @default [] */
                            cluster_allowlist?: string[];
                        };
                    } | null;
                    tags?: string[];
                    dedup_findings?: boolean;
                    /** @enum {string} */
                    engine_mode?: "current" | "next" | "compare";
                    sub_agent_model?: string;
                    runagent_fastpath?: boolean;
                    expose_prior_triage?: boolean;
                    require_approval_all_actions?: boolean;
                    approval_required_tools?: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        customer_id: string;
                        name: string;
                        description?: string | null;
                        template_type: string;
                        /** @enum {string} */
                        status: "idle" | "running" | "paused" | "failed";
                        model_id: string;
                        system_prompt: string;
                        /**
                         * @default findings
                         * @enum {string}
                         */
                        output_mode: "findings" | "report";
                        pipeline_config: {
                            name: string;
                            type: string;
                            config?: {
                                [key: string]: unknown;
                            };
                        }[];
                        trigger_config: ({
                            /** @constant */
                            type: "schedule";
                            cron: string;
                            /** @default UTC */
                            timezone: string;
                        } | {
                            /** @constant */
                            type: "event";
                            /** @enum {string} */
                            event_type?: "detection" | "cloud_event" | "simulation_event";
                            /** @default [] */
                            severities: string[];
                            /** @default [] */
                            conditions: {
                                field: string;
                                operator: string;
                                /** @default [] */
                                values: string[];
                            }[];
                        })[];
                        action_config: {
                            /** @constant */
                            type: "chain";
                            target_agent_id: string;
                            /**
                             * @default any_finding
                             * @enum {string}
                             */
                            condition: "any_finding" | "critical_only" | "high_and_above" | "llm_eval";
                            condition_prompt?: string;
                            /** @enum {string} */
                            min_severity?: "critical" | "high" | "medium" | "low" | "info";
                            require_findings?: boolean;
                            require_approval?: boolean;
                        }[];
                        target_scope: {
                            /** @default false */
                            all_accounts: boolean;
                            account_ids?: string[];
                            /** @default false */
                            all_resource_types: boolean;
                            resource_types?: string[];
                            /** @default false */
                            all_regions: boolean;
                            regions?: string[];
                        };
                        execution_pipeline?: {
                            steps: string[];
                            compiled_system_prompt: string;
                            data_sources: string[];
                            /** @enum {string} */
                            output_mode?: "findings" | "report";
                            compiled_at: string;
                            source_hash: string;
                            step_configs?: {
                                name: string;
                                focus?: string;
                                tool_groups: string[];
                                action_binding_ids?: string[];
                                depends_on: number[];
                                sub_prompt: string;
                                autoApprove?: boolean;
                                /**
                                 * @default normal
                                 * @enum {string}
                                 */
                                type: "normal" | "foreach" | "invoke" | "conditional";
                                source_step_index?: number;
                                per_item_sub_prompt?: string;
                                target_agent_id?: string;
                                condition_prompt?: string;
                                if_true_steps?: number[];
                                if_false_steps?: number[];
                            }[] | null;
                        } | null;
                        /** @default false */
                        web_search_enabled: boolean;
                        /** @default false */
                        require_approval: boolean;
                        /** @default [] */
                        allowed_tool_groups: string[];
                        /** @default [] */
                        plugin_reauth_pending: {
                            plugin_id: string;
                            operation_id: string;
                            reason: string;
                        }[];
                        /** @default [] */
                        action_bindings: {
                            id: string;
                            integration: string;
                            action_key: string;
                            display_name: string;
                            /** @default {} */
                            bound_params: {
                                [key: string]: unknown;
                            };
                            /** @default [] */
                            customized_field_specs: {
                                field_key: string;
                                field_name?: string;
                                field_type?: string;
                                /** @default false */
                                required: boolean;
                                allowed_values?: {
                                    value?: string;
                                    id?: string;
                                    name?: string;
                                }[];
                            }[];
                            /** @default [] */
                            omit_llm_params: string[];
                            webhook_body?: {
                                key: string;
                                /** @enum {string} */
                                kind: "value" | "object" | "array";
                                value?: unknown;
                                pinned?: boolean;
                            }[];
                        }[];
                        response_tool_scope?: {
                            cloud?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                response_action_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                resource_tag_allowlist: {
                                    key: string;
                                    value?: string;
                                }[];
                            };
                            runtime?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                allowed_action_types: string[];
                                /** @default [] */
                                provider_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                cluster_allowlist: string[];
                            };
                        } | null;
                        /** @default [] */
                        tags: string[];
                        /** @default true */
                        dedup_findings: boolean;
                        /** @default false */
                        require_approval_all_actions: boolean;
                        /** @default [] */
                        approval_required_tools: string[];
                        icon?: string | null;
                        created_by?: string | null;
                        created_by_name?: string | null;
                        created_by_email?: string | null;
                        /**
                         * @default current
                         * @enum {string}
                         */
                        engine_mode: "current" | "next" | "compare";
                        sub_agent_model?: string | null;
                        runagent_fastpath?: boolean | null;
                        expose_prior_triage?: boolean | null;
                        created_at: string;
                        updated_at: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-agents-pause": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        customer_id: string;
                        name: string;
                        description?: string | null;
                        template_type: string;
                        /** @enum {string} */
                        status: "idle" | "running" | "paused" | "failed";
                        model_id: string;
                        system_prompt: string;
                        /**
                         * @default findings
                         * @enum {string}
                         */
                        output_mode: "findings" | "report";
                        pipeline_config: {
                            name: string;
                            type: string;
                            config?: {
                                [key: string]: unknown;
                            };
                        }[];
                        trigger_config: ({
                            /** @constant */
                            type: "schedule";
                            cron: string;
                            /** @default UTC */
                            timezone: string;
                        } | {
                            /** @constant */
                            type: "event";
                            /** @enum {string} */
                            event_type?: "detection" | "cloud_event" | "simulation_event";
                            /** @default [] */
                            severities: string[];
                            /** @default [] */
                            conditions: {
                                field: string;
                                operator: string;
                                /** @default [] */
                                values: string[];
                            }[];
                        })[];
                        action_config: {
                            /** @constant */
                            type: "chain";
                            target_agent_id: string;
                            /**
                             * @default any_finding
                             * @enum {string}
                             */
                            condition: "any_finding" | "critical_only" | "high_and_above" | "llm_eval";
                            condition_prompt?: string;
                            /** @enum {string} */
                            min_severity?: "critical" | "high" | "medium" | "low" | "info";
                            require_findings?: boolean;
                            require_approval?: boolean;
                        }[];
                        target_scope: {
                            /** @default false */
                            all_accounts: boolean;
                            account_ids?: string[];
                            /** @default false */
                            all_resource_types: boolean;
                            resource_types?: string[];
                            /** @default false */
                            all_regions: boolean;
                            regions?: string[];
                        };
                        execution_pipeline?: {
                            steps: string[];
                            compiled_system_prompt: string;
                            data_sources: string[];
                            /** @enum {string} */
                            output_mode?: "findings" | "report";
                            compiled_at: string;
                            source_hash: string;
                            step_configs?: {
                                name: string;
                                focus?: string;
                                tool_groups: string[];
                                action_binding_ids?: string[];
                                depends_on: number[];
                                sub_prompt: string;
                                autoApprove?: boolean;
                                /**
                                 * @default normal
                                 * @enum {string}
                                 */
                                type: "normal" | "foreach" | "invoke" | "conditional";
                                source_step_index?: number;
                                per_item_sub_prompt?: string;
                                target_agent_id?: string;
                                condition_prompt?: string;
                                if_true_steps?: number[];
                                if_false_steps?: number[];
                            }[] | null;
                        } | null;
                        /** @default false */
                        web_search_enabled: boolean;
                        /** @default false */
                        require_approval: boolean;
                        /** @default [] */
                        allowed_tool_groups: string[];
                        /** @default [] */
                        plugin_reauth_pending: {
                            plugin_id: string;
                            operation_id: string;
                            reason: string;
                        }[];
                        /** @default [] */
                        action_bindings: {
                            id: string;
                            integration: string;
                            action_key: string;
                            display_name: string;
                            /** @default {} */
                            bound_params: {
                                [key: string]: unknown;
                            };
                            /** @default [] */
                            customized_field_specs: {
                                field_key: string;
                                field_name?: string;
                                field_type?: string;
                                /** @default false */
                                required: boolean;
                                allowed_values?: {
                                    value?: string;
                                    id?: string;
                                    name?: string;
                                }[];
                            }[];
                            /** @default [] */
                            omit_llm_params: string[];
                            webhook_body?: {
                                key: string;
                                /** @enum {string} */
                                kind: "value" | "object" | "array";
                                value?: unknown;
                                pinned?: boolean;
                            }[];
                        }[];
                        response_tool_scope?: {
                            cloud?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                response_action_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                resource_tag_allowlist: {
                                    key: string;
                                    value?: string;
                                }[];
                            };
                            runtime?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                allowed_action_types: string[];
                                /** @default [] */
                                provider_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                cluster_allowlist: string[];
                            };
                        } | null;
                        /** @default [] */
                        tags: string[];
                        /** @default true */
                        dedup_findings: boolean;
                        /** @default false */
                        require_approval_all_actions: boolean;
                        /** @default [] */
                        approval_required_tools: string[];
                        icon?: string | null;
                        created_by?: string | null;
                        created_by_name?: string | null;
                        created_by_email?: string | null;
                        /**
                         * @default current
                         * @enum {string}
                         */
                        engine_mode: "current" | "next" | "compare";
                        sub_agent_model?: string | null;
                        runagent_fastpath?: boolean | null;
                        expose_prior_triage?: boolean | null;
                        created_at: string;
                        updated_at: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-agents-resume": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        customer_id: string;
                        name: string;
                        description?: string | null;
                        template_type: string;
                        /** @enum {string} */
                        status: "idle" | "running" | "paused" | "failed";
                        model_id: string;
                        system_prompt: string;
                        /**
                         * @default findings
                         * @enum {string}
                         */
                        output_mode: "findings" | "report";
                        pipeline_config: {
                            name: string;
                            type: string;
                            config?: {
                                [key: string]: unknown;
                            };
                        }[];
                        trigger_config: ({
                            /** @constant */
                            type: "schedule";
                            cron: string;
                            /** @default UTC */
                            timezone: string;
                        } | {
                            /** @constant */
                            type: "event";
                            /** @enum {string} */
                            event_type?: "detection" | "cloud_event" | "simulation_event";
                            /** @default [] */
                            severities: string[];
                            /** @default [] */
                            conditions: {
                                field: string;
                                operator: string;
                                /** @default [] */
                                values: string[];
                            }[];
                        })[];
                        action_config: {
                            /** @constant */
                            type: "chain";
                            target_agent_id: string;
                            /**
                             * @default any_finding
                             * @enum {string}
                             */
                            condition: "any_finding" | "critical_only" | "high_and_above" | "llm_eval";
                            condition_prompt?: string;
                            /** @enum {string} */
                            min_severity?: "critical" | "high" | "medium" | "low" | "info";
                            require_findings?: boolean;
                            require_approval?: boolean;
                        }[];
                        target_scope: {
                            /** @default false */
                            all_accounts: boolean;
                            account_ids?: string[];
                            /** @default false */
                            all_resource_types: boolean;
                            resource_types?: string[];
                            /** @default false */
                            all_regions: boolean;
                            regions?: string[];
                        };
                        execution_pipeline?: {
                            steps: string[];
                            compiled_system_prompt: string;
                            data_sources: string[];
                            /** @enum {string} */
                            output_mode?: "findings" | "report";
                            compiled_at: string;
                            source_hash: string;
                            step_configs?: {
                                name: string;
                                focus?: string;
                                tool_groups: string[];
                                action_binding_ids?: string[];
                                depends_on: number[];
                                sub_prompt: string;
                                autoApprove?: boolean;
                                /**
                                 * @default normal
                                 * @enum {string}
                                 */
                                type: "normal" | "foreach" | "invoke" | "conditional";
                                source_step_index?: number;
                                per_item_sub_prompt?: string;
                                target_agent_id?: string;
                                condition_prompt?: string;
                                if_true_steps?: number[];
                                if_false_steps?: number[];
                            }[] | null;
                        } | null;
                        /** @default false */
                        web_search_enabled: boolean;
                        /** @default false */
                        require_approval: boolean;
                        /** @default [] */
                        allowed_tool_groups: string[];
                        /** @default [] */
                        plugin_reauth_pending: {
                            plugin_id: string;
                            operation_id: string;
                            reason: string;
                        }[];
                        /** @default [] */
                        action_bindings: {
                            id: string;
                            integration: string;
                            action_key: string;
                            display_name: string;
                            /** @default {} */
                            bound_params: {
                                [key: string]: unknown;
                            };
                            /** @default [] */
                            customized_field_specs: {
                                field_key: string;
                                field_name?: string;
                                field_type?: string;
                                /** @default false */
                                required: boolean;
                                allowed_values?: {
                                    value?: string;
                                    id?: string;
                                    name?: string;
                                }[];
                            }[];
                            /** @default [] */
                            omit_llm_params: string[];
                            webhook_body?: {
                                key: string;
                                /** @enum {string} */
                                kind: "value" | "object" | "array";
                                value?: unknown;
                                pinned?: boolean;
                            }[];
                        }[];
                        response_tool_scope?: {
                            cloud?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                response_action_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                resource_tag_allowlist: {
                                    key: string;
                                    value?: string;
                                }[];
                            };
                            runtime?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                allowed_action_types: string[];
                                /** @default [] */
                                provider_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                cluster_allowlist: string[];
                            };
                        } | null;
                        /** @default [] */
                        tags: string[];
                        /** @default true */
                        dedup_findings: boolean;
                        /** @default false */
                        require_approval_all_actions: boolean;
                        /** @default [] */
                        approval_required_tools: string[];
                        icon?: string | null;
                        created_by?: string | null;
                        created_by_name?: string | null;
                        created_by_email?: string | null;
                        /**
                         * @default current
                         * @enum {string}
                         */
                        engine_mode: "current" | "next" | "compare";
                        sub_agent_model?: string | null;
                        runagent_fastpath?: boolean | null;
                        expose_prior_triage?: boolean | null;
                        created_at: string;
                        updated_at: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-agents-triggerRun": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Extra instructions for this run. Max 2000 characters. */
                    additional_prompt?: string;
                    finding_context?: {
                        /** @enum {string} */
                        finding_type: "violation" | "detection" | "attack_path" | "config_change" | "vulnerability" | "case";
                        finding_id?: string;
                        rule_id?: string;
                        cve_id?: string;
                        resource_id?: string;
                        resource_type?: string;
                        resource_name?: string;
                        severity?: string;
                        account_id?: string;
                        /** @description Max 2000 characters. */
                        summary?: string;
                    };
                    source_run_id?: string;
                    /** @enum {string} */
                    engine_mode?: "current" | "next" | "compare";
                    require_approval?: boolean;
                    sub_agent_model?: string;
                    runagent_fastpath?: boolean;
                    dry_run?: boolean;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        run_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-agents-recompile": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        customer_id: string;
                        name: string;
                        description?: string | null;
                        template_type: string;
                        /** @enum {string} */
                        status: "idle" | "running" | "paused" | "failed";
                        model_id: string;
                        system_prompt: string;
                        /**
                         * @default findings
                         * @enum {string}
                         */
                        output_mode: "findings" | "report";
                        pipeline_config: {
                            name: string;
                            type: string;
                            config?: {
                                [key: string]: unknown;
                            };
                        }[];
                        trigger_config: ({
                            /** @constant */
                            type: "schedule";
                            cron: string;
                            /** @default UTC */
                            timezone: string;
                        } | {
                            /** @constant */
                            type: "event";
                            /** @enum {string} */
                            event_type?: "detection" | "cloud_event" | "simulation_event";
                            /** @default [] */
                            severities: string[];
                            /** @default [] */
                            conditions: {
                                field: string;
                                operator: string;
                                /** @default [] */
                                values: string[];
                            }[];
                        })[];
                        action_config: {
                            /** @constant */
                            type: "chain";
                            target_agent_id: string;
                            /**
                             * @default any_finding
                             * @enum {string}
                             */
                            condition: "any_finding" | "critical_only" | "high_and_above" | "llm_eval";
                            condition_prompt?: string;
                            /** @enum {string} */
                            min_severity?: "critical" | "high" | "medium" | "low" | "info";
                            require_findings?: boolean;
                            require_approval?: boolean;
                        }[];
                        target_scope: {
                            /** @default false */
                            all_accounts: boolean;
                            account_ids?: string[];
                            /** @default false */
                            all_resource_types: boolean;
                            resource_types?: string[];
                            /** @default false */
                            all_regions: boolean;
                            regions?: string[];
                        };
                        execution_pipeline?: {
                            steps: string[];
                            compiled_system_prompt: string;
                            data_sources: string[];
                            /** @enum {string} */
                            output_mode?: "findings" | "report";
                            compiled_at: string;
                            source_hash: string;
                            step_configs?: {
                                name: string;
                                focus?: string;
                                tool_groups: string[];
                                action_binding_ids?: string[];
                                depends_on: number[];
                                sub_prompt: string;
                                autoApprove?: boolean;
                                /**
                                 * @default normal
                                 * @enum {string}
                                 */
                                type: "normal" | "foreach" | "invoke" | "conditional";
                                source_step_index?: number;
                                per_item_sub_prompt?: string;
                                target_agent_id?: string;
                                condition_prompt?: string;
                                if_true_steps?: number[];
                                if_false_steps?: number[];
                            }[] | null;
                        } | null;
                        /** @default false */
                        web_search_enabled: boolean;
                        /** @default false */
                        require_approval: boolean;
                        /** @default [] */
                        allowed_tool_groups: string[];
                        /** @default [] */
                        plugin_reauth_pending: {
                            plugin_id: string;
                            operation_id: string;
                            reason: string;
                        }[];
                        /** @default [] */
                        action_bindings: {
                            id: string;
                            integration: string;
                            action_key: string;
                            display_name: string;
                            /** @default {} */
                            bound_params: {
                                [key: string]: unknown;
                            };
                            /** @default [] */
                            customized_field_specs: {
                                field_key: string;
                                field_name?: string;
                                field_type?: string;
                                /** @default false */
                                required: boolean;
                                allowed_values?: {
                                    value?: string;
                                    id?: string;
                                    name?: string;
                                }[];
                            }[];
                            /** @default [] */
                            omit_llm_params: string[];
                            webhook_body?: {
                                key: string;
                                /** @enum {string} */
                                kind: "value" | "object" | "array";
                                value?: unknown;
                                pinned?: boolean;
                            }[];
                        }[];
                        response_tool_scope?: {
                            cloud?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                response_action_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                resource_tag_allowlist: {
                                    key: string;
                                    value?: string;
                                }[];
                            };
                            runtime?: {
                                /** @default false */
                                allow_all: boolean;
                                /** @default [] */
                                allowed_action_types: string[];
                                /** @default [] */
                                provider_allowlist: string[];
                                /** @default [] */
                                account_allowlist: string[];
                                /** @default [] */
                                cluster_allowlist: string[];
                            };
                        } | null;
                        /** @default [] */
                        tags: string[];
                        /** @default true */
                        dedup_findings: boolean;
                        /** @default false */
                        require_approval_all_actions: boolean;
                        /** @default [] */
                        approval_required_tools: string[];
                        icon?: string | null;
                        created_by?: string | null;
                        created_by_name?: string | null;
                        created_by_email?: string | null;
                        /**
                         * @default current
                         * @enum {string}
                         */
                        engine_mode: "current" | "next" | "compare";
                        sub_agent_model?: string | null;
                        runagent_fastpath?: boolean | null;
                        expose_prior_triage?: boolean | null;
                        created_at: string;
                        updated_at: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-runs-list": {
        parameters: {
            query: {
                agent_id: string;
                status?: "pending" | "running" | "completed" | "failed" | "cancelled" | "awaiting_approval";
                statuses?: ("pending" | "running" | "completed" | "failed" | "cancelled" | "awaiting_approval")[];
                outcomes?: ("critical" | "high" | "medium" | "low" | "info" | "clean" | "deduplicated")[];
                trigger_types?: ("schedule" | "event" | "detection" | "chain" | "invoke" | "manual")[];
                started_from?: string;
                started_to?: string;
                duration_min_ms?: number;
                duration_max_ms?: number;
                run_id?: string;
                sort_by?: "started_at" | "duration_ms" | "run_id" | "outcome" | "status";
                sort_dir?: "asc" | "desc";
                limit?: number;
                cursor?: number;
                include_hidden?: boolean;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: {
                            id: string;
                            agent_id: string;
                            customer_id: string;
                            /** @enum {string} */
                            status: "pending" | "running" | "completed" | "failed" | "cancelled" | "awaiting_approval";
                            /** @enum {string} */
                            trigger_type: "schedule" | "event" | "detection" | "chain" | "invoke" | "manual";
                            trigger_context?: {
                                [key: string]: unknown;
                            } | null;
                            triggered_by_user?: {
                                full_name?: string | null;
                                email?: string | null;
                            } | null;
                            pipeline_state?: {
                                name: string;
                                /** @enum {string} */
                                type: "analyze" | "enrich" | "report" | "action" | "invoke" | "chain";
                                /** @enum {string} */
                                status: "pending" | "running" | "completed" | "failed" | "skipped";
                                started_at?: string | null;
                                completed_at?: string | null;
                                error?: string | null;
                                simulation_event_ids?: string[] | null;
                                mutated_resource_ids?: string[] | null;
                                target_agent_name?: string | null;
                                reasoning?: string | null;
                                child_run_id?: string | null;
                            }[] | null;
                            started_at: string;
                            completed_at?: string | null;
                            duration_ms?: number | null;
                            parent_run_id?: string | null;
                            /** @default 0 */
                            chain_depth: number;
                            error_message?: string | null;
                            /** @default 0 */
                            findings_count: number;
                            /** @default 0 */
                            actions_count: number;
                            max_severity?: ("critical" | "high" | "medium" | "low" | "info") | null;
                            summary?: string | null;
                            /** @default 0 */
                            dedup_skipped: number;
                            events_scanned?: number | null;
                            analysis_window_from?: string | null;
                            analysis_window_to?: string | null;
                            estimated_cost_usd: number | null;
                            engine?: string | null;
                            hidden?: boolean | null;
                            approval_outcome?: ("approved" | "rejected" | "partial") | null;
                            execution_status?: ("succeeded" | "partial" | "failed") | null;
                            /** @default 0 */
                            pending_actions_count: number;
                        }[];
                        total: number;
                        nextCursor: number | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-runs-listByStatus": {
        parameters: {
            query: {
                bucket: "running" | "awaiting_approval" | "completed" | "failed";
                hours?: number;
                cursor?: number;
                limit?: number;
                include_hidden?: boolean;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: {
                            id: string;
                            agent_id: string;
                            agent_name: string;
                            /** @enum {string} */
                            status: "pending" | "running" | "completed" | "failed" | "cancelled" | "awaiting_approval";
                            /** @enum {string} */
                            trigger_type: "schedule" | "event" | "detection" | "chain" | "invoke" | "manual";
                            started_at: string;
                            completed_at?: string | null;
                            duration_ms?: number | null;
                            /** @default 0 */
                            findings_count: number;
                            max_severity?: ("critical" | "high" | "medium" | "low" | "info") | null;
                            /** @default 0 */
                            dedup_skipped: number;
                            error_message?: string | null;
                            summary?: string | null;
                            pipeline_state?: {
                                name: string;
                                /** @enum {string} */
                                type: "analyze" | "enrich" | "report" | "action" | "invoke" | "chain";
                                /** @enum {string} */
                                status: "pending" | "running" | "completed" | "failed" | "skipped";
                                started_at?: string | null;
                                completed_at?: string | null;
                                error?: string | null;
                                simulation_event_ids?: string[] | null;
                                mutated_resource_ids?: string[] | null;
                                target_agent_name?: string | null;
                                reasoning?: string | null;
                                child_run_id?: string | null;
                            }[] | null;
                            template_type?: string | null;
                            /** @default [] */
                            tools_used: string[];
                            parent_run_id?: string | null;
                            approval_outcome?: ("approved" | "rejected" | "partial") | null;
                            execution_status?: ("succeeded" | "partial" | "failed") | null;
                            engine?: string | null;
                            hidden?: boolean | null;
                        }[];
                        total: number;
                        nextCursor: number | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-runs-get": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        agent_id: string;
                        customer_id: string;
                        /** @enum {string} */
                        status: "pending" | "running" | "completed" | "failed" | "cancelled" | "awaiting_approval";
                        /** @enum {string} */
                        trigger_type: "schedule" | "event" | "detection" | "chain" | "invoke" | "manual";
                        trigger_context?: {
                            [key: string]: unknown;
                        } | null;
                        triggered_by_user?: {
                            full_name?: string | null;
                            email?: string | null;
                        } | null;
                        pipeline_state?: {
                            name: string;
                            /** @enum {string} */
                            type: "analyze" | "enrich" | "report" | "action" | "invoke" | "chain";
                            /** @enum {string} */
                            status: "pending" | "running" | "completed" | "failed" | "skipped";
                            started_at?: string | null;
                            completed_at?: string | null;
                            error?: string | null;
                            simulation_event_ids?: string[] | null;
                            mutated_resource_ids?: string[] | null;
                            target_agent_name?: string | null;
                            reasoning?: string | null;
                            child_run_id?: string | null;
                        }[] | null;
                        started_at: string;
                        completed_at?: string | null;
                        duration_ms?: number | null;
                        parent_run_id?: string | null;
                        /** @default 0 */
                        chain_depth: number;
                        error_message?: string | null;
                        /** @default 0 */
                        findings_count: number;
                        /** @default 0 */
                        actions_count: number;
                        max_severity?: ("critical" | "high" | "medium" | "low" | "info") | null;
                        summary?: string | null;
                        /** @default 0 */
                        dedup_skipped: number;
                        events_scanned?: number | null;
                        analysis_window_from?: string | null;
                        analysis_window_to?: string | null;
                        estimated_cost_usd: number | null;
                        engine?: string | null;
                        hidden?: boolean | null;
                        approval_outcome?: ("approved" | "rejected" | "partial") | null;
                        execution_status?: ("succeeded" | "partial" | "failed") | null;
                        /** @default 0 */
                        pending_actions_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-runs-cancel": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-runs-approve": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    action_ids?: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-runs-reject": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    action_ids?: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-runs-retryAction": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
                action_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-findings-list": {
        parameters: {
            query: {
                run_id: string;
                severity?: "critical" | "high" | "medium" | "low" | "info";
                status?: "open" | "acknowledged" | "resolved" | "dismissed";
                limit?: number;
                cursor?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: {
                            id: string;
                            run_id: string;
                            agent_id: string;
                            customer_id: string;
                            /** @enum {string} */
                            severity: "critical" | "high" | "medium" | "low" | "info";
                            title: string;
                            description: string;
                            reasoning_steps?: {
                                /** @default 0 */
                                step: number;
                                /** @default  */
                                title: string;
                                /** @default  */
                                description: string;
                                evidence?: {
                                    [key: string]: unknown;
                                } | null;
                                confidence?: number | null;
                                source_tool?: string | null;
                                source_args?: {
                                    [key: string]: unknown;
                                } | null;
                            }[] | null;
                            evidence?: {
                                [key: string]: unknown;
                            } | null;
                            confidence?: number | null;
                            resource_ids?: string[] | null;
                            simulation_event_ids?: string[] | null;
                            mutated_resource_ids?: string[] | null;
                            references?: {
                                type: string;
                                id: string;
                                label?: string | null;
                            }[] | null;
                            /** @enum {string} */
                            status: "open" | "acknowledged" | "resolved" | "dismissed";
                            actions_taken?: {
                                [key: string]: unknown;
                            }[] | null;
                            recommendation?: string | null;
                            remediation_status?: ("not_started" | "in_progress" | "completed" | "not_applicable") | null;
                            is_false_positive?: boolean | null;
                            fp_rate?: number | null;
                            exclusion_status?: ("auto_applied" | "pending_review") | null;
                            alerts_matched?: number | null;
                            total_alerts?: number | null;
                            hidden?: boolean | null;
                            created_at: string;
                        }[];
                        total: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-findings-get": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        run_id: string;
                        agent_id: string;
                        customer_id: string;
                        /** @enum {string} */
                        severity: "critical" | "high" | "medium" | "low" | "info";
                        title: string;
                        description: string;
                        reasoning_steps?: {
                            /** @default 0 */
                            step: number;
                            /** @default  */
                            title: string;
                            /** @default  */
                            description: string;
                            evidence?: {
                                [key: string]: unknown;
                            } | null;
                            confidence?: number | null;
                            source_tool?: string | null;
                            source_args?: {
                                [key: string]: unknown;
                            } | null;
                        }[] | null;
                        evidence?: {
                            [key: string]: unknown;
                        } | null;
                        confidence?: number | null;
                        resource_ids?: string[] | null;
                        simulation_event_ids?: string[] | null;
                        mutated_resource_ids?: string[] | null;
                        references?: {
                            type: string;
                            id: string;
                            label?: string | null;
                        }[] | null;
                        /** @enum {string} */
                        status: "open" | "acknowledged" | "resolved" | "dismissed";
                        actions_taken?: {
                            [key: string]: unknown;
                        }[] | null;
                        recommendation?: string | null;
                        remediation_status?: ("not_started" | "in_progress" | "completed" | "not_applicable") | null;
                        is_false_positive?: boolean | null;
                        fp_rate?: number | null;
                        exclusion_status?: ("auto_applied" | "pending_review") | null;
                        alerts_matched?: number | null;
                        total_alerts?: number | null;
                        hidden?: boolean | null;
                        created_at: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-logs-list": {
        parameters: {
            query: {
                run_id: string;
                log_level?: "debug" | "info" | "warn" | "error";
                limit?: number;
                cursor?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: {
                            id: string;
                            run_id: string;
                            step_name?: string | null;
                            /** @enum {string} */
                            log_level: "debug" | "info" | "warn" | "error";
                            message: string;
                            metadata?: {
                                [key: string]: unknown;
                            } | null;
                            timestamp: string;
                        }[];
                        total: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-actionLogs-list": {
        parameters: {
            query: {
                run_id: string;
                limit?: number;
                cursor?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: {
                            id: string;
                            run_id: string;
                            finding_id?: string | null;
                            action_type: string;
                            name?: string | null;
                            description?: string | null;
                            action_config?: {
                                [key: string]: unknown;
                            } | null;
                            result?: {
                                [key: string]: unknown;
                            } | null;
                            /** @enum {string} */
                            status: "pending" | "sent" | "failed";
                            child_run_id?: string | null;
                            reasoning?: string | null;
                            reasoning_steps?: {
                                /** @default 0 */
                                step: number;
                                /** @default  */
                                title: string;
                                /** @default  */
                                description: string;
                                evidence?: {
                                    [key: string]: unknown;
                                } | null;
                                confidence?: number | null;
                                source_tool?: string | null;
                                source_args?: {
                                    [key: string]: unknown;
                                } | null;
                            }[] | null;
                            created_at: string;
                        }[];
                        total: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-pendingActions-list": {
        parameters: {
            query: {
                run_id: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: {
                            id: string;
                            run_id: string;
                            agent_id: string;
                            customer_id: string;
                            /** @enum {string} */
                            source: "native" | "binding" | "plugin" | "post_run";
                            tool_name?: string | null;
                            integration?: string | null;
                            action_key?: string | null;
                            binding_id?: string | null;
                            tool_identifier: string;
                            display_name: string;
                            summary?: string | null;
                            action_description?: string | null;
                            /** @enum {string} */
                            access: "write" | "execute" | "read-only";
                            /** @default false */
                            destructive: boolean;
                            /** @default {} */
                            resolved_args: {
                                [key: string]: unknown;
                            };
                            args_hash?: string | null;
                            /** @default [] */
                            bound_param_keys: string[];
                            scope_verdict?: {
                                [key: string]: unknown;
                            } | null;
                            sequence: number;
                            /** @default [] */
                            depends_on: string[];
                            /** @enum {string} */
                            status: "queued" | "approved" | "running" | "succeeded" | "partial" | "accepted" | "unconfirmed" | "failed" | "rejected" | "skipped";
                            decided_by?: string | null;
                            decided_at?: string | null;
                            retried_by?: string | null;
                            retried_at?: string | null;
                            executed_at?: string | null;
                            result?: {
                                [key: string]: unknown;
                            } | null;
                            error?: string | null;
                            /** @default 0 */
                            attempts: number;
                            created_at: string;
                            updated_at: string;
                        }[];
                        total: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-dashboard-stats": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        total_agents: number;
                        running_agents: number;
                        paused_agents: number;
                        failed_agents: number;
                        findings_24h: number;
                        critical_findings_24h: number;
                        open_findings: number;
                        total_runs: number;
                        active_chains: number;
                        needs_attention: {
                            agent_id: string;
                            agent_name: string;
                            issue: string;
                            /** @enum {string} */
                            severity: "error" | "warning";
                        }[];
                        recent_activity: {
                            agent_name: string;
                            /** @enum {string} */
                            status: "pending" | "running" | "completed" | "failed" | "cancelled";
                            findings_count: number;
                            completed_at: string;
                            current_step?: string;
                        }[];
                        recent_chains: {
                            parent_run_id: string;
                            parent_agent_name: string;
                            parent_agent_id: string;
                            child_run_id: string;
                            child_agent_name: string;
                            child_agent_id: string;
                            chain_depth?: number;
                            /** @enum {string} */
                            status: "pending" | "running" | "completed" | "failed" | "cancelled";
                            created_at: string;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-actionCatalog-list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        order: string[];
                        integrations: {
                            key: string;
                            label: string;
                            description?: string;
                            /** @enum {string} */
                            kind: "per-action" | "stream" | "coming-soon" | "plugin";
                            icon: {
                                mono: string;
                                bg: string;
                                fg: string;
                            };
                            actions?: {
                                key: string;
                                display_name: string;
                                description: string;
                                params: {
                                    key: string;
                                    /** @enum {string} */
                                    type: "string" | "enum" | "array" | "number" | "boolean";
                                    required: boolean;
                                    /** @enum {string} */
                                    scoping: "bind_only" | "flexible" | "llm_only";
                                    description: string;
                                    label?: string;
                                    options?: string[];
                                    default?: unknown;
                                    min?: number;
                                    max?: number;
                                    /** @enum {string} */
                                    role?: "target";
                                }[];
                                output_schema: {
                                    key: string;
                                    type: string;
                                    required: boolean;
                                    description: string;
                                    link_label?: string;
                                }[];
                                /** @enum {string} */
                                access: "read-only" | "read + write" | "write" | "execute";
                                destructive?: boolean;
                                required_integration?: string;
                                result_summary?: string;
                            }[];
                            instances?: string[];
                            groups?: {
                                id: string;
                                display_name: string;
                                description: string;
                                /** @enum {string} */
                                access: "read-only" | "read + write" | "write" | "execute";
                                category?: string;
                                note?: string;
                                backend_keys?: string[];
                                read_write_pair_of?: string;
                                required_integration?: string;
                                destructive?: boolean;
                            }[];
                            note?: string;
                            required_integration?: string;
                        }[];
                    };
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-actionCatalog-testWebhook": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    webhook_id: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        delivered: boolean;
                        status_code?: number;
                        latency_ms?: number;
                        error_class?: string;
                        error?: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-responseCatalog-list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        cloud: {
                            id: string;
                            name: string;
                            description: string;
                            provider?: string;
                        }[];
                        runtime: {
                            id: string;
                            name: string;
                            description: string;
                            provider?: string;
                        }[];
                    };
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-kb-list": {
        parameters: {
            query?: {
                search?: string;
                status?: "pending" | "ingesting" | "ingested" | "failed";
                topic?: string;
                limit?: number;
                cursor?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: {
                            id: string;
                            customer_id: string;
                            title: string;
                            /** @enum {string} */
                            source_type: "manual" | "upload" | "url" | "integration";
                            source_uri?: string | null;
                            doc_summary?: string | null;
                            /** @default [] */
                            topics: string[];
                            /** @enum {string} */
                            status: "pending" | "ingesting" | "ingested" | "failed";
                            /** @default 0 */
                            section_count: number;
                            /** @default 0 */
                            ingest_attempts: number;
                            error_message?: string | null;
                            created_by?: string | null;
                            created_at: string;
                            updated_at: string;
                        }[];
                        total: number;
                        nextCursor: number | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-kb-create": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Max 200 characters. */
                    title: string;
                    /** @description Max 200000 characters; split larger material into several documents. */
                    content: string;
                    /**
                     * @default manual
                     * @enum {string}
                     */
                    source_type?: "manual" | "upload" | "url" | "integration";
                    source_uri?: string | null;
                    /** @default [] */
                    topics?: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        customer_id: string;
                        title: string;
                        /** @enum {string} */
                        source_type: "manual" | "upload" | "url" | "integration";
                        source_uri?: string | null;
                        content: string;
                        content_hash?: string | null;
                        doc_summary?: string | null;
                        /** @default [] */
                        topics: string[];
                        /** @enum {string} */
                        status: "pending" | "ingesting" | "ingested" | "failed";
                        /** @default 0 */
                        section_count: number;
                        /** @default 0 */
                        ingest_attempts: number;
                        error_message?: string | null;
                        created_by?: string | null;
                        created_at: string;
                        updated_at: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-kb-get": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        document: {
                            id: string;
                            customer_id: string;
                            title: string;
                            /** @enum {string} */
                            source_type: "manual" | "upload" | "url" | "integration";
                            source_uri?: string | null;
                            content: string;
                            content_hash?: string | null;
                            doc_summary?: string | null;
                            /** @default [] */
                            topics: string[];
                            /** @enum {string} */
                            status: "pending" | "ingesting" | "ingested" | "failed";
                            /** @default 0 */
                            section_count: number;
                            /** @default 0 */
                            ingest_attempts: number;
                            error_message?: string | null;
                            created_by?: string | null;
                            created_at: string;
                            updated_at: string;
                        };
                        sections: {
                            id: string;
                            customer_id: string;
                            doc_id: string;
                            doc_title: string;
                            section_id: string;
                            heading?: string | null;
                            summary: string;
                            body: string;
                            /** @default [] */
                            tags: string[];
                            /** @default [] */
                            entities: string[];
                            chunk_index: number;
                            updated_at: string;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-kb-delete": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-kb-update": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Max 200 characters. */
                    title?: string;
                    /** @description Max 200000 characters; split larger material into several documents. */
                    content?: string;
                    source_uri?: string | null;
                    topics?: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        customer_id: string;
                        title: string;
                        /** @enum {string} */
                        source_type: "manual" | "upload" | "url" | "integration";
                        source_uri?: string | null;
                        content: string;
                        content_hash?: string | null;
                        doc_summary?: string | null;
                        /** @default [] */
                        topics: string[];
                        /** @enum {string} */
                        status: "pending" | "ingesting" | "ingested" | "failed";
                        /** @default 0 */
                        section_count: number;
                        /** @default 0 */
                        ingest_attempts: number;
                        error_message?: string | null;
                        created_by?: string | null;
                        created_at: string;
                        updated_at: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-kb-upload": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Max 255 characters. */
                    filename: string;
                    data: string;
                    /** @description Max 200 characters. */
                    title?: string;
                    /** @default [] */
                    topics?: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        customer_id: string;
                        title: string;
                        /** @enum {string} */
                        source_type: "manual" | "upload" | "url" | "integration";
                        source_uri?: string | null;
                        content: string;
                        content_hash?: string | null;
                        doc_summary?: string | null;
                        /** @default [] */
                        topics: string[];
                        /** @enum {string} */
                        status: "pending" | "ingesting" | "ingested" | "failed";
                        /** @default 0 */
                        section_count: number;
                        /** @default 0 */
                        ingest_attempts: number;
                        error_message?: string | null;
                        created_by?: string | null;
                        created_at: string;
                        updated_at: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-kb-search": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Max 1000 characters. */
                    query: string;
                    topic?: string;
                    /** @default 5 */
                    limit?: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            section_id: string;
                            doc_id: string;
                            doc_title: string;
                            heading?: string | null;
                            summary: string;
                            snippet: string;
                            tags: string[];
                            score: number;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "streamforce-kb-getDoc": {
        parameters: {
            query?: {
                section_id?: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                doc_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        document: {
                            doc_id: string;
                            title: string;
                            doc_summary?: string | null;
                            topics: string[];
                            total_sections: number;
                        };
                        sections: {
                            section_id: string;
                            heading?: string | null;
                            summary: string;
                            content: string;
                            truncated: boolean;
                            chunk_index: number;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "simulation-simulateEventImpact": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description List of resource change records to simulate. */
                    changes: {
                        account_id: string;
                        region: string;
                        /** @description The resource's Lightlytics inventory resource_type — use the exact value from inventory__details's `resource_type` field (e.g. "pod", "security_group", "network_acl"). Do NOT use the Terraform/cloud-prefixed form ("aws_security_group", "aws_eks_pod"): the simulator keys on the inventory schema name and a prefixed/unknown type fails with an opaque 500. */
                        resource_type: string;
                        /** @enum {string} */
                        action: "created" | "modified" | "deleted";
                        /** @description Translated resource state after the change. Required for created/modified. */
                        after?: {
                            [key: string]: unknown;
                        } | null;
                        /** @description Translated resource state before the change. Required for modified/deleted. */
                        before?: {
                            [key: string]: unknown;
                        } | null;
                    }[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        simulation_timestamp: number | null;
                        event_id: string | null;
                        new_violations: {
                            rule_name: string | null;
                            severity: string | null;
                            rule_type: string | null;
                        }[];
                        path_impact_summary: {
                            network: {
                                new: {
                                    src_type: string;
                                    dst_type: string;
                                    count: number;
                                }[];
                                closed: {
                                    src_type: string;
                                    dst_type: string;
                                    count: number;
                                }[];
                                modified: {
                                    src_type: string;
                                    dst_type: string;
                                    count: number;
                                }[];
                            } | null;
                            permissions: {
                                new: {
                                    src_type: string;
                                    dst_type: string;
                                    count: number;
                                }[];
                                closed: {
                                    src_type: string;
                                    dst_type: string;
                                    count: number;
                                }[];
                                modified: {
                                    src_type: string;
                                    dst_type: string;
                                    count: number;
                                }[];
                            } | null;
                        };
                        errors: string[];
                        sub_events_count?: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "rules-list": {
        parameters: {
            query?: {
                _id?: string[];
                account_ids?: string[];
                severity?: number[];
                rule_type?: string[];
                finding_type?: ("misconfiguration" | "internet_exposed" | "insecure_identity" | "vulnerability" | "high_privileges" | "privilege_escalation" | "data_access" | "crown_jewel_access" | "admin_privileges" | "external_access" | "segmentation_breach" | "hosted_secret")[];
                category?: ("Security" | "Cost" | "Availability" | "Sustainability" | "Other")[];
                labels?: string[];
                status?: string[];
                state?: string[];
                created_by?: string[];
                compliance_controls_ids?: string[];
                compliance?: string[];
                include_violations_count?: boolean;
                violations_resource_ids?: string[];
                phrase?: string;
                skip?: number;
                limit?: number;
                include_system_managed?: boolean;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            id: string;
                            violations_count?: number;
                            name: string;
                            /** @enum {string} */
                            status: "pending" | "pending_fullscan" | "processing" | "active" | "invalid" | "inactive" | "error" | "disabled" | "archived" | "draft";
                            exclusions_count?: number;
                            /** @enum {string} */
                            state: "enabled" | "disabled" | "draft" | "archived";
                            /** @enum {string} */
                            category: "Security" | "Cost" | "Availability" | "Sustainability" | "Other";
                            severity: number;
                            description?: string;
                            remediation?: string;
                            labels?: string[];
                            compliance?: string[];
                            /** @enum {string} */
                            rule_type?: "resource" | "path";
                            /** @enum {string} */
                            finding_type?: "misconfiguration" | "internet_exposed" | "insecure_identity" | "vulnerability" | "high_privileges" | "privilege_escalation" | "data_access" | "crown_jewel_access" | "admin_privileges" | "external_access" | "segmentation_breach" | "hosted_secret";
                            /** @enum {string} */
                            subject?: "source" | "intermediate" | "destination";
                            path_source_predicates?: {
                                resource_type?: string;
                                resource_id?: string;
                                expiration_date?: string;
                                is_expired?: boolean;
                                attributes?: {
                                    /** @enum {string} */
                                    operand: "OR" | "AND";
                                    attributes_list: components["schemas"]["__schema1"][];
                                };
                                tags?: {
                                    /** @enum {string} */
                                    operand: "OR" | "AND";
                                    attributes_list: components["schemas"]["__schema1"][];
                                };
                                locations?: {
                                    /** @enum {string} */
                                    location_type: "Account" | "Subscription" | "GCPProjectAccount" | "Region" | "vpc";
                                    location_value: string;
                                    /** @enum {string} */
                                    match_type?: "equals" | "not_equals" | "contains" | "not_contains" | "matches_regex";
                                }[];
                                /** @enum {string} */
                                locations_operand?: "AND" | "OR";
                            }[];
                            /** @enum {string} */
                            path_source_predicate_operand?: "OR" | "AND";
                            path_intermediate_predicates?: {
                                resource_type?: string;
                                resource_id?: string;
                                expiration_date?: string;
                                is_expired?: boolean;
                                attributes?: {
                                    /** @enum {string} */
                                    operand: "OR" | "AND";
                                    attributes_list: components["schemas"]["__schema1"][];
                                };
                                tags?: {
                                    /** @enum {string} */
                                    operand: "OR" | "AND";
                                    attributes_list: components["schemas"]["__schema1"][];
                                };
                                locations?: {
                                    /** @enum {string} */
                                    location_type: "Account" | "Subscription" | "GCPProjectAccount" | "Region" | "vpc";
                                    location_value: string;
                                    /** @enum {string} */
                                    match_type?: "equals" | "not_equals" | "contains" | "not_contains" | "matches_regex";
                                }[];
                                /** @enum {string} */
                                locations_operand?: "AND" | "OR";
                            }[];
                            /** @enum {string} */
                            path_intermediate_predicate_operand?: "OR" | "AND";
                            path_destination_predicates?: {
                                resource_type?: string;
                                resource_id?: string;
                                expiration_date?: string;
                                is_expired?: boolean;
                                attributes?: {
                                    /** @enum {string} */
                                    operand: "OR" | "AND";
                                    attributes_list: components["schemas"]["__schema1"][];
                                };
                                tags?: {
                                    /** @enum {string} */
                                    operand: "OR" | "AND";
                                    attributes_list: components["schemas"]["__schema1"][];
                                };
                                locations?: {
                                    /** @enum {string} */
                                    location_type: "Account" | "Subscription" | "GCPProjectAccount" | "Region" | "vpc";
                                    location_value: string;
                                    /** @enum {string} */
                                    match_type?: "equals" | "not_equals" | "contains" | "not_contains" | "matches_regex";
                                }[];
                                /** @enum {string} */
                                locations_operand?: "AND" | "OR";
                            }[];
                            /** @enum {string} */
                            path_destination_predicate_operand?: "OR" | "AND";
                            path_source_predicate_equals_match?: boolean;
                            path_intermediate_predicate_equals_match?: boolean;
                            path_destination_predicate_equals_match?: boolean;
                            exclusion_predicates?: {
                                resource_type?: string;
                                resource_id?: string;
                                expiration_date?: string;
                                is_expired?: boolean;
                                attributes?: {
                                    /** @enum {string} */
                                    operand: "OR" | "AND";
                                    attributes_list: components["schemas"]["__schema1"][];
                                };
                                tags?: {
                                    /** @enum {string} */
                                    operand: "OR" | "AND";
                                    attributes_list: components["schemas"]["__schema1"][];
                                };
                                locations?: {
                                    /** @enum {string} */
                                    location_type: "Account" | "Subscription" | "GCPProjectAccount" | "Region" | "vpc";
                                    location_value: string;
                                    /** @enum {string} */
                                    match_type?: "equals" | "not_equals" | "contains" | "not_contains" | "matches_regex";
                                }[];
                                /** @enum {string} */
                                locations_operand?: "AND" | "OR";
                            }[];
                            resource_predicates?: {
                                resource_type?: string;
                                resource_id?: string;
                                expiration_date?: string;
                                is_expired?: boolean;
                                attributes?: {
                                    /** @enum {string} */
                                    operand: "OR" | "AND";
                                    attributes_list: components["schemas"]["__schema1"][];
                                };
                                tags?: {
                                    /** @enum {string} */
                                    operand: "OR" | "AND";
                                    attributes_list: components["schemas"]["__schema1"][];
                                };
                                locations?: {
                                    /** @enum {string} */
                                    location_type: "Account" | "Subscription" | "GCPProjectAccount" | "Region" | "vpc";
                                    location_value: string;
                                    /** @enum {string} */
                                    match_type?: "equals" | "not_equals" | "contains" | "not_contains" | "matches_regex";
                                }[];
                                /** @enum {string} */
                                locations_operand?: "AND" | "OR";
                            }[];
                            ports?: {
                                start?: number;
                                end?: number;
                                protocol?: string;
                            }[];
                            allowed_actions?: {
                                /** @enum {string} */
                                operand?: "OR" | "AND";
                                actions_list?: components["schemas"]["__schema2"][];
                            };
                            fail_simulation?: boolean;
                            execution_conditions?: {
                                events?: boolean;
                                periodic?: boolean;
                                simulation?: boolean;
                            };
                            /** @enum {string} */
                            action?: "create" | "modify" | "delete";
                            creation_date?: string;
                            created_by?: string;
                            remediation_available?: boolean;
                            notification_channels?: {
                                type: string;
                                id?: string;
                                recipients?: string[];
                            }[];
                            relevant_attributes?: string[];
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "rules-create": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    rule: {
                        /** @constant */
                        rule_type: "resource";
                        /** @description Rule name (required). */
                        name: string;
                        /** @description Rule description. */
                        description?: string;
                        /** @description Remediation guidance text. */
                        remediation?: string;
                        /**
                         * @default Security
                         * @enum {string}
                         */
                        category?: "Security" | "Cost" | "Availability" | "Sustainability" | "Other";
                        /**
                         * @description Rule severity (uppercase enum).
                         * @enum {string}
                         */
                        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
                        /**
                         * @default enabled
                         * @enum {string}
                         */
                        state?: "enabled" | "disabled" | "draft" | "archived";
                        labels?: string[];
                        compliance?: string[];
                        /** @description Single predicate describing the resource that must match. */
                        resource_predicate: {
                            /** @description Resource type (e.g. "s3_bucket", "instance", "network_interface", "Internet"). */
                            resource_type: string;
                            locations?: {
                                /** @enum {string} */
                                location_type: "Account" | "Subscription" | "GCPProjectAccount" | "Region" | "vpc";
                                location_value: string;
                                match_type?: ("equals" | "not_equals" | "contains" | "not_contains" | "matches_regex") | null;
                            }[];
                            locations_operand?: ("AND" | "OR") | null;
                            attributes?: {
                                /** @enum {string} */
                                operand: "AND" | "OR";
                                attributes_list: {
                                    name: string;
                                    value: string[];
                                    /** @enum {string} */
                                    match_type: "equals" | "not_equals" | "contains" | "not_contains" | "is_null" | "is_not_null" | "greater_than" | "greater_equal" | "less_than" | "less_equal" | "matches_regex";
                                    /** @enum {string} */
                                    operand?: "AND" | "OR";
                                }[];
                            };
                        };
                    } | {
                        /** @constant */
                        rule_type: "path";
                        /** @description Rule name (required). */
                        name: string;
                        /** @description Rule description. */
                        description?: string;
                        /** @description Remediation guidance text. */
                        remediation?: string;
                        /**
                         * @default Security
                         * @enum {string}
                         */
                        category?: "Security" | "Cost" | "Availability" | "Sustainability" | "Other";
                        /**
                         * @description Rule severity (uppercase enum).
                         * @enum {string}
                         */
                        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
                        /**
                         * @default enabled
                         * @enum {string}
                         */
                        state?: "enabled" | "disabled" | "draft" | "archived";
                        labels?: string[];
                        compliance?: string[];
                        /**
                         * @description Which end of the path the finding is attributed to.
                         * @enum {string}
                         */
                        subject: "source" | "destination";
                        /** @description Source predicate(s) (at least one required). */
                        path_source_predicate: {
                            /** @description Resource type (e.g. "s3_bucket", "instance", "network_interface", "Internet"). */
                            resource_type: string;
                            locations?: {
                                /** @enum {string} */
                                location_type: "Account" | "Subscription" | "GCPProjectAccount" | "Region" | "vpc";
                                location_value: string;
                                match_type?: ("equals" | "not_equals" | "contains" | "not_contains" | "matches_regex") | null;
                            }[];
                            locations_operand?: ("AND" | "OR") | null;
                            attributes?: {
                                /** @enum {string} */
                                operand: "AND" | "OR";
                                attributes_list: {
                                    name: string;
                                    value: string[];
                                    /** @enum {string} */
                                    match_type: "equals" | "not_equals" | "contains" | "not_contains" | "is_null" | "is_not_null" | "greater_than" | "greater_equal" | "less_than" | "less_equal" | "matches_regex";
                                    /** @enum {string} */
                                    operand?: "AND" | "OR";
                                }[];
                            };
                        }[];
                        /** @description Optional intermediate predicate(s). */
                        path_intermediate_predicate?: {
                            /** @description Resource type (e.g. "s3_bucket", "instance", "network_interface", "Internet"). */
                            resource_type: string;
                            locations?: {
                                /** @enum {string} */
                                location_type: "Account" | "Subscription" | "GCPProjectAccount" | "Region" | "vpc";
                                location_value: string;
                                match_type?: ("equals" | "not_equals" | "contains" | "not_contains" | "matches_regex") | null;
                            }[];
                            locations_operand?: ("AND" | "OR") | null;
                            attributes?: {
                                /** @enum {string} */
                                operand: "AND" | "OR";
                                attributes_list: {
                                    name: string;
                                    value: string[];
                                    /** @enum {string} */
                                    match_type: "equals" | "not_equals" | "contains" | "not_contains" | "is_null" | "is_not_null" | "greater_than" | "greater_equal" | "less_than" | "less_equal" | "matches_regex";
                                    /** @enum {string} */
                                    operand?: "AND" | "OR";
                                }[];
                            };
                        }[];
                        /** @description Destination predicate(s) (at least one required). */
                        path_destination_predicate: {
                            /** @description Resource type (e.g. "s3_bucket", "instance", "network_interface", "Internet"). */
                            resource_type: string;
                            locations?: {
                                /** @enum {string} */
                                location_type: "Account" | "Subscription" | "GCPProjectAccount" | "Region" | "vpc";
                                location_value: string;
                                match_type?: ("equals" | "not_equals" | "contains" | "not_contains" | "matches_regex") | null;
                            }[];
                            locations_operand?: ("AND" | "OR") | null;
                            attributes?: {
                                /** @enum {string} */
                                operand: "AND" | "OR";
                                attributes_list: {
                                    name: string;
                                    value: string[];
                                    /** @enum {string} */
                                    match_type: "equals" | "not_equals" | "contains" | "not_contains" | "is_null" | "is_not_null" | "greater_than" | "greater_equal" | "less_than" | "less_equal" | "matches_regex";
                                    /** @enum {string} */
                                    operand?: "AND" | "OR";
                                }[];
                            };
                        }[];
                    };
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        name: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "rules-search": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    filters?: {
                        severity?: number[];
                        category?: ("Security" | "Cost" | "Availability" | "Sustainability" | "Other")[];
                        labels?: string[];
                        compliance?: string[];
                        status?: string[];
                        state?: string[];
                        created_by?: string[];
                        finding_type?: string[];
                        rule_type?: string[];
                        name?: string;
                        account_ids?: string[];
                        archived?: boolean;
                        fail_simulation?: boolean;
                        only_violations?: boolean;
                    };
                    /** @default 0 */
                    skip?: number;
                    limit?: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            id: string;
                            name: string;
                            description?: string | null;
                            severity: number;
                            category: string;
                            status: string;
                            state: string;
                            labels?: string[] | null;
                            compliance?: string[] | null;
                            finding_type?: string | null;
                            rule_type?: string | null;
                            fail_simulation?: boolean | null;
                            created_by?: string | null;
                            creation_date?: string | null;
                            violation_count: number;
                            exclusions_count: number;
                        }[];
                        total_count: number;
                        violations_by_severity: {
                            [key: string]: number;
                        };
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "rules-facets": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": Record<string, never>;
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        severities: number[];
                        creators: string[];
                        labels: string[];
                        compliance: string[];
                        categories: string[];
                        statuses: string[];
                        rule_types: string[];
                        finding_types: string[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "rules-bulkUpdate": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    ids?: string[];
                    filters?: {
                        severity?: number[];
                        category?: ("Security" | "Cost" | "Availability" | "Sustainability" | "Other")[];
                        labels?: string[];
                        compliance?: string[];
                        status?: string[];
                        state?: string[];
                        created_by?: string[];
                        finding_type?: string[];
                        rule_type?: string[];
                        name?: string;
                        account_ids?: string[];
                        archived?: boolean;
                        fail_simulation?: boolean;
                        only_violations?: boolean;
                    };
                    rule_changes: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "rules-bulkUpdateListFields": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    ids?: string[];
                    filters?: {
                        severity?: number[];
                        category?: ("Security" | "Cost" | "Availability" | "Sustainability" | "Other")[];
                        labels?: string[];
                        compliance?: string[];
                        status?: string[];
                        state?: string[];
                        created_by?: string[];
                        finding_type?: string[];
                        rule_type?: string[];
                        name?: string;
                        account_ids?: string[];
                        archived?: boolean;
                        fail_simulation?: boolean;
                        only_violations?: boolean;
                    };
                    /** @enum {string} */
                    field_name: "labels" | "compliance";
                    change_list: string[];
                    remove_flag: boolean;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "rules-commonFields": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    filters?: {
                        severity?: number[];
                        category?: ("Security" | "Cost" | "Availability" | "Sustainability" | "Other")[];
                        labels?: string[];
                        compliance?: string[];
                        status?: string[];
                        state?: string[];
                        created_by?: string[];
                        finding_type?: string[];
                        rule_type?: string[];
                        name?: string;
                        account_ids?: string[];
                        archived?: boolean;
                        fail_simulation?: boolean;
                        only_violations?: boolean;
                    };
                    fields: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        labels?: string[];
                        compliance?: string[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "rules-ruleViolationsRest": {
        parameters: {
            query?: {
                skip?: number;
                limit?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                rule_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            subject_id: string;
                            first_seen_timestamp?: string | null;
                            controller_kind?: string | null;
                            member_count?: number;
                            child_resources?: {
                                subject_id: string;
                                first_seen_timestamp?: string | null;
                            }[];
                        }[];
                        total_count?: number;
                        total_instance_count?: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "rules-resourceViolations": {
        parameters: {
            query?: {
                skip?: number;
                limit?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                resource_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        rule_id: string;
                        first_seen_timestamp?: string;
                        count?: number;
                    }[];
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "rules-createExclusion": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description The rule ID to add exclusions to */
                    rule_id: string;
                    /** @description Resource IDs to exclude from this rule */
                    subject_ids: string[];
                    /** @description Reason for the exclusion */
                    comment?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "rules-deleteExclusion": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description The rule ID to remove exclusions from */
                    rule_id: string;
                    /** @description Resource IDs to remove from exclusion list */
                    subject_ids: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-list": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @default {} */
                    filters?: {
                        status?: ("open" | "in_progress" | "closed" | "remediated") | ("open" | "in_progress" | "closed" | "remediated")[];
                        severity?: number;
                        priority?: ("P1" | "P2" | "P3" | "P4") | ("low" | "medium" | "high" | "critical");
                        assignee_id?: string;
                        tags?: string[];
                        detection_id?: string;
                    };
                    /** @default {} */
                    sort?: {
                        column?: string;
                        order?: 1 | -1;
                    };
                    /** @default 50 */
                    limit?: number;
                    /** @default 0 */
                    skip?: number;
                    /** @default false */
                    include_archived?: boolean;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            _id: string;
                            case_number: string;
                            title: string;
                            description: string;
                            /** @enum {string} */
                            status: "open" | "in_progress" | "closed" | "remediated";
                            severity: number;
                            priority: ("P1" | "P2" | "P3" | "P4") | ("low" | "medium" | "high" | "critical");
                            assignee_id?: string | null;
                            assignee_type?: string;
                            assignee_email?: string | null;
                            detection_ids?: string[];
                            event_ids?: string[];
                            resource_ids?: string[];
                            tags?: string[];
                            verdict?: string | null;
                            playbook?: ({
                                playbook_id?: string;
                                name?: string;
                                description?: string;
                                category?: string;
                                content?: string;
                                completed?: boolean;
                                completed_at?: string | null;
                                completed_by?: string | null;
                                template_id?: string | null;
                                is_adhoc?: boolean;
                                added_by?: string;
                                added_at?: string;
                            } & {
                                [key: string]: unknown;
                            })[];
                            playbook_template_id?: string | null;
                            notes?: {
                                id: string;
                                name: string;
                                body: string;
                                created_by?: string;
                                created_at?: string;
                                updated_by?: string | null;
                                updated_at?: string | null;
                            }[];
                            escalated?: boolean;
                            escalated_at?: string | null;
                            sla_response_hours?: number | null;
                            sla_resolution_hours?: number | null;
                            sla_response_met?: boolean | null;
                            sla_resolution_met?: boolean | null;
                            first_response_at?: string | null;
                            related_case_ids?: string[];
                            parent_case_id?: string | null;
                            created_at: string;
                            updated_at: string;
                            closed_at?: string | null;
                            created_by: string;
                            created_by_email?: string;
                            archived?: boolean;
                            archived_at?: string | null;
                            archived_by?: string | null;
                            archived_reason?: string | null;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-get": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        _id: string;
                        case_number: string;
                        title: string;
                        description: string;
                        /** @enum {string} */
                        status: "open" | "in_progress" | "closed" | "remediated";
                        severity: number;
                        priority: ("P1" | "P2" | "P3" | "P4") | ("low" | "medium" | "high" | "critical");
                        assignee_id?: string | null;
                        assignee_type?: string;
                        assignee_email?: string | null;
                        detection_ids?: string[];
                        event_ids?: string[];
                        resource_ids?: string[];
                        tags?: string[];
                        verdict?: string | null;
                        playbook?: ({
                            playbook_id?: string;
                            name?: string;
                            description?: string;
                            category?: string;
                            content?: string;
                            completed?: boolean;
                            completed_at?: string | null;
                            completed_by?: string | null;
                            template_id?: string | null;
                            is_adhoc?: boolean;
                            added_by?: string;
                            added_at?: string;
                        } & {
                            [key: string]: unknown;
                        })[];
                        playbook_template_id?: string | null;
                        notes?: {
                            id: string;
                            name: string;
                            body: string;
                            created_by?: string;
                            created_at?: string;
                            updated_by?: string | null;
                            updated_at?: string | null;
                        }[];
                        escalated?: boolean;
                        escalated_at?: string | null;
                        sla_response_hours?: number | null;
                        sla_resolution_hours?: number | null;
                        sla_response_met?: boolean | null;
                        sla_resolution_met?: boolean | null;
                        first_response_at?: string | null;
                        related_case_ids?: string[];
                        parent_case_id?: string | null;
                        created_at: string;
                        updated_at: string;
                        closed_at?: string | null;
                        created_by: string;
                        created_by_email?: string;
                        archived?: boolean;
                        archived_at?: string | null;
                        archived_by?: string | null;
                        archived_reason?: string | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-update": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    title?: string;
                    description?: string;
                    /** @enum {string} */
                    priority?: "P1" | "P2" | "P3" | "P4";
                    tags?: string[];
                    sla_response_hours?: number | null;
                    sla_resolution_hours?: number | null;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-create": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    title: string;
                    /** @default  */
                    description?: string;
                    /** @default 3 */
                    severity?: number;
                    /**
                     * @default P3
                     * @enum {string}
                     */
                    priority?: "P1" | "P2" | "P3" | "P4";
                    /** @default [] */
                    detection_ids?: string[];
                    /** @default [] */
                    event_ids?: string[];
                    assignee_id?: string | null;
                    /** @default user */
                    assignee_type?: string;
                    /** @default [] */
                    tags?: string[];
                    sla_response_hours?: number | null;
                    sla_resolution_hours?: number | null;
                    playbook_template_id?: string | null;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        _id: string;
                        case_number: string;
                        title: string;
                        description: string;
                        /** @enum {string} */
                        status: "open" | "in_progress" | "closed" | "remediated";
                        severity: number;
                        priority: ("P1" | "P2" | "P3" | "P4") | ("low" | "medium" | "high" | "critical");
                        assignee_id?: string | null;
                        assignee_type?: string;
                        assignee_email?: string | null;
                        detection_ids?: string[];
                        event_ids?: string[];
                        resource_ids?: string[];
                        tags?: string[];
                        verdict?: string | null;
                        playbook?: ({
                            playbook_id?: string;
                            name?: string;
                            description?: string;
                            category?: string;
                            content?: string;
                            completed?: boolean;
                            completed_at?: string | null;
                            completed_by?: string | null;
                            template_id?: string | null;
                            is_adhoc?: boolean;
                            added_by?: string;
                            added_at?: string;
                        } & {
                            [key: string]: unknown;
                        })[];
                        playbook_template_id?: string | null;
                        notes?: {
                            id: string;
                            name: string;
                            body: string;
                            created_by?: string;
                            created_at?: string;
                            updated_by?: string | null;
                            updated_at?: string | null;
                        }[];
                        escalated?: boolean;
                        escalated_at?: string | null;
                        sla_response_hours?: number | null;
                        sla_resolution_hours?: number | null;
                        sla_response_met?: boolean | null;
                        sla_resolution_met?: boolean | null;
                        first_response_at?: string | null;
                        related_case_ids?: string[];
                        parent_case_id?: string | null;
                        created_at: string;
                        updated_at: string;
                        closed_at?: string | null;
                        created_by: string;
                        created_by_email?: string;
                        archived?: boolean;
                        archived_at?: string | null;
                        archived_by?: string | null;
                        archived_reason?: string | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-setStatus": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    new_status: "open" | "in_progress" | "closed" | "remediated";
                    comment?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-assign": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    assignee_id: string | null;
                    /** @default user */
                    assignee_type?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-setSeverity": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    severity: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-escalate": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reason: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-setVerdict": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    verdict: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_id: string;
                        verdict: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-board": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @default {} */
                    filters?: {
                        status?: ("open" | "in_progress" | "closed" | "remediated") | ("open" | "in_progress" | "closed" | "remediated")[];
                        severity?: number;
                        priority?: ("P1" | "P2" | "P3" | "P4") | ("low" | "medium" | "high" | "critical");
                        assignee_id?: string;
                        tags?: string[];
                        detection_id?: string;
                    };
                    /** @default false */
                    include_archived?: boolean;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: {
                            cases: {
                                _id: string;
                                case_number: string;
                                title: string;
                                description: string;
                                /** @enum {string} */
                                status: "open" | "in_progress" | "closed" | "remediated";
                                severity: number;
                                priority: ("P1" | "P2" | "P3" | "P4") | ("low" | "medium" | "high" | "critical");
                                assignee_id?: string | null;
                                assignee_type?: string;
                                assignee_email?: string | null;
                                detection_ids?: string[];
                                event_ids?: string[];
                                resource_ids?: string[];
                                tags?: string[];
                                verdict?: string | null;
                                playbook?: ({
                                    playbook_id?: string;
                                    name?: string;
                                    description?: string;
                                    category?: string;
                                    content?: string;
                                    completed?: boolean;
                                    completed_at?: string | null;
                                    completed_by?: string | null;
                                    template_id?: string | null;
                                    is_adhoc?: boolean;
                                    added_by?: string;
                                    added_at?: string;
                                } & {
                                    [key: string]: unknown;
                                })[];
                                playbook_template_id?: string | null;
                                notes?: {
                                    id: string;
                                    name: string;
                                    body: string;
                                    created_by?: string;
                                    created_at?: string;
                                    updated_by?: string | null;
                                    updated_at?: string | null;
                                }[];
                                escalated?: boolean;
                                escalated_at?: string | null;
                                sla_response_hours?: number | null;
                                sla_resolution_hours?: number | null;
                                sla_response_met?: boolean | null;
                                sla_resolution_met?: boolean | null;
                                first_response_at?: string | null;
                                related_case_ids?: string[];
                                parent_case_id?: string | null;
                                created_at: string;
                                updated_at: string;
                                closed_at?: string | null;
                                created_by: string;
                                created_by_email?: string;
                                archived?: boolean;
                                archived_at?: string | null;
                                archived_by?: string | null;
                                archived_reason?: string | null;
                            }[];
                            count: number;
                        };
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-timeline": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        timeline: {
                            [key: string]: unknown;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-detections-add": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    detection_ids: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        added_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-detections-remove": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
                detection_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        removed_detection_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-comment-edit": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    action_id: string;
                    comment: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_activity_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-comment-create": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    comment: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        inserted_activity_id?: unknown;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-comment-delete": {
        parameters: {
            query: {
                action_id: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        deleted_activity_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-playbook-applyTemplate": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    template_id: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        playbook: {
                            [key: string]: unknown;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-playbook-applyAdhoc": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    description?: string;
                    category?: string;
                    content?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        playbook: {
                            [key: string]: unknown;
                        }[];
                        playbook_id?: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-playbook-remove": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
                playbook_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        playbook: {
                            [key: string]: unknown;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-playbook-toggle": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
                playbook_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    completed: boolean;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        playbook: {
                            [key: string]: unknown;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-notes-add": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    body: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        notes: {
                            [key: string]: unknown;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-notes-update": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
                note_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    body: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        notes: {
                            [key: string]: unknown;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-notes-remove": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
                note_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        notes: {
                            [key: string]: unknown;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-playbookTemplates-list": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        templates: {
                            _id: string;
                            name: string;
                            description?: string;
                            category?: string;
                            content?: string;
                            mapping_rules?: {
                                activity_type?: string;
                                resource_type?: string;
                                rule_labels?: string[];
                                rule_id?: string;
                            }[];
                            created_by?: string;
                            created_by_email?: string;
                            created_at?: string;
                            updated_at?: string;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-playbookTemplates-create": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    /** @default  */
                    description?: string;
                    /** @default  */
                    category?: string;
                    /** @default  */
                    content?: string;
                    /** @default [] */
                    mapping_rules?: {
                        activity_type?: string;
                        resource_type?: string;
                        rule_labels?: string[];
                        rule_id?: string;
                    }[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        inserted_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-playbookTemplates-get": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                template_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        _id: string;
                        name: string;
                        description?: string;
                        category?: string;
                        content?: string;
                        mapping_rules?: {
                            activity_type?: string;
                            resource_type?: string;
                            rule_labels?: string[];
                            rule_id?: string;
                        }[];
                        created_by?: string;
                        created_by_email?: string;
                        created_at?: string;
                        updated_at?: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-playbookTemplates-update": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                template_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name?: string;
                    description?: string;
                    category?: string;
                    content?: string;
                    mapping_rules?: {
                        activity_type?: string;
                        resource_type?: string;
                        rule_labels?: string[];
                        rule_id?: string;
                    }[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-playbookTemplates-delete": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                template_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        deleted_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-linkTicket": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    ticket_key: string;
                    ticket_url: string;
                    ticket_system_type: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        inserted_activity_id?: unknown;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-relate": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    related_case_id: string;
                    /** @default related */
                    relationship_type?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-unrelate": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
                related_case_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-related": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        related_cases: {
                            [key: string]: unknown;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-archive": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reason?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cases-unarchive": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                case_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-list": {
        parameters: {
            query?: {
                _id?: string[];
                resource_id?: string[];
                anomaly_severity?: number[];
                from_timestamp?: string;
                to_timestamp?: string;
                account_id?: string[];
                activity_type?: ("suspicious_identity_activity" | "anomalous_network_traffic" | "suspicious_kubernetes_activity" | "anomalous_activity" | "cost_anomaly" | "detection_rule_activity" | "third_party_activity" | "suspicious_canary_activity" | "anomalous_process_activity" | "anomalous_files_activity" | "anomalous_apis_activity" | "ai_injection_detected_activity")[];
                source?: ("azure_defender" | "azure_identity_protection" | "stream_runtime" | "stream" | "crowd_strike" | "guard_duty" | "sentinel_one" | "cortex" | "security_command_center" | "netskope" | "zscaler")[];
                status?: string[];
                cloud_type?: string[];
                cluster?: string[];
                region?: string[];
                resource_type?: string[];
                vpc_id?: string[];
                tags?: ({
                    key: string;
                    value: string;
                    /** @enum {string} */
                    key_operand: "contains" | "equals";
                    /** @enum {string} */
                    value_operand: "contains" | "equals";
                } | (string | {
                    key: string;
                    value: string;
                    /** @enum {string} */
                    key_operand: "contains" | "equals";
                    /** @enum {string} */
                    value_operand: "contains" | "equals";
                }))[];
                mitre_categories?: string[];
                signal_types?: string[];
                rule_id?: string[];
                triage_recommended_verdict?: string[];
                triage_confidence?: string[];
                acknowledged?: boolean;
                triggered_canary_resource_id?: string[];
                ticket_id?: string[];
                fields?: string[];
                sort?: {
                    field?: string | null;
                    direction?: ("asc" | "desc") | null;
                };
                skip?: number;
                limit?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        total_count?: number | null;
                        results: {
                            _id: string;
                            timestamp?: string;
                            activity_type?: string;
                            account_id?: string[];
                            anomaly_severity?: number;
                            cluster?: string;
                            container_name?: string;
                            process_name?: string;
                            source?: string;
                            namespace?: string;
                            resource_id?: string;
                            resource_type?: string;
                            resource_name?: string;
                            resource_cluster?: string;
                            resource_deployment?: string;
                            resource_namespace?: string;
                            resource_controller?: string;
                            service?: string;
                            mitre_categories?: string[];
                            signal_types?: string[];
                            session_list?: {
                                ip_addresses?: {
                                    Ip: string;
                                    CountryCode: string;
                                }[];
                                access_keys?: string[];
                                user_agents?: string[];
                                src_resource_type?: string[];
                            } | {
                                ip_address?: string;
                                access_key?: string;
                                user_agent?: string;
                                country_code_iso?: string;
                                mfa?: boolean;
                            }[];
                            external_id?: string;
                            external_url?: string;
                            json_data?: string;
                            /** @enum {string} */
                            status?: "open" | "in_progress" | "closed";
                            suspicious_identity_activity_signals?: {
                                [key: string]: unknown;
                            };
                            anomalous_network_traffic_signals?: {
                                [key: string]: unknown;
                            };
                            suspicious_kubernetes_signals?: {
                                [key: string]: unknown;
                            };
                            unusual_activity_signals?: {
                                [key: string]: unknown;
                            };
                            cost_anomaly_signals?: {
                                [key: string]: unknown;
                            };
                            detection_rule_activity_signals?: {
                                [key: string]: unknown;
                            };
                            third_party_signals?: {
                                [key: string]: unknown;
                            };
                            anomalous_apis_activity_signals?: {
                                [key: string]: unknown;
                            };
                            triage_summary?: string | null;
                            triage_reasoning?: string | null;
                            triage_timestamp?: string | null;
                            /** @default null */
                            triage_confidence: ("Low" | "Medium" | "High") | null;
                            /** @default null */
                            triage_recommended_verdict: ("Benign" | "Suspicious" | "Malicious") | null;
                            /** @default null */
                            triage_status: ("Pending" | "Completed") | null;
                            /** @default null */
                            triage_suggested_severity: ("Low" | "Medium" | "High" | "Critical") | null;
                            triage_notification_summary?: string | null;
                            acknowledged?: boolean | null;
                            acknowledgement_details?: {
                                timestamp?: string | null;
                                user?: string | null;
                                reason?: string | null;
                            } | null;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-summary": {
        parameters: {
            query?: {
                hours_window?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                detection_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        summary: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-baseline": {
        parameters: {
            query: {
                principalType?: string;
                baselineKey?: string;
                principalId: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        baseline_available: boolean;
                        baseline_lookup: {
                            principal_type: string;
                            principal_id: string;
                            /** @enum {string} */
                            source: "principal_type" | "baseline_key" | "inventory" | "email_heuristic";
                        };
                        _id?: string | null;
                        entity_key?: string;
                        last_seen?: string;
                        first_seen?: string;
                        active_times?: {
                            weekday: string;
                            hours: {
                                start: string;
                                end: string;
                            }[];
                            last_seen: string;
                        }[];
                        actions?: {
                            action: string;
                            event_count: number;
                            last_seen: string;
                            regions?: {
                                [key: string]: string;
                            };
                            destinations?: {
                                [key: string]: string;
                            };
                        }[];
                        locations?: {
                            location: string;
                            last_seen: string;
                        }[];
                        services?: {
                            service: string;
                            event_count: number;
                            last_seen: string;
                        }[];
                        controller_type?: string;
                        controller_id?: string;
                        resource_type?: string;
                        runtime?: {
                            images: {
                                image: string;
                                first_seen?: string | null;
                                last_seen?: string | null;
                                processes: {
                                    binary: string;
                                    first_seen?: string | null;
                                    last_seen?: string | null;
                                    parents: string[];
                                    cwds: string[];
                                    preloads: string[];
                                    function_names: string[];
                                }[];
                                file_operations: {
                                    process: string;
                                    binary_path?: string | null;
                                    operations: {
                                        operation: string;
                                        function_names: string[];
                                        file_paths: {
                                            path: string;
                                            first_seen?: string | null;
                                            last_seen?: string | null;
                                            file_flags?: string[];
                                        }[];
                                    }[];
                                }[];
                            }[];
                        };
                        connections?: {
                            destinations: {
                                type: string;
                                target: string;
                                last_seen?: string | null;
                            }[];
                            first_seen?: string | null;
                            last_seen?: string | null;
                        };
                        audit?: {
                            first_seen?: string | null;
                            last_seen?: string | null;
                            actions: {
                                verb: string;
                                resource: string;
                                subresource: string;
                                last_seen?: string | null;
                            }[];
                            threat_ratings: {
                                tier: string;
                                indicator: string;
                                count?: number;
                                last_alarm?: string | null;
                            }[];
                            locations: {
                                location: string;
                                last_seen: string;
                            }[];
                            active_times: {
                                weekday: string;
                                hours: {
                                    start: string;
                                    end: string;
                                }[];
                                last_seen: string;
                            }[];
                        };
                        api_calls?: {
                            calls: {
                                direction: string;
                                host: string;
                                path: string;
                                process: string;
                                raw_host: string;
                                raw_path: string;
                                raw_process: string;
                                methods: string[];
                                first_seen?: string | null;
                                last_seen?: string | null;
                            }[];
                        };
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-apiBaseline": {
        parameters: {
            query: {
                principalType: string;
                principalId: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        calls: {
                            direction: string;
                            host: string;
                            path: string;
                            process: string;
                            raw_host: string;
                            raw_path: string;
                            raw_process: string;
                            methods: string[];
                            first_seen?: string | null;
                            last_seen?: string | null;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-identityBaseline": {
        parameters: {
            query: {
                principalType: string;
                principalId: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        actions: {
                            action: string;
                            event_count: number;
                            last_seen: string;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-activityBaseline": {
        parameters: {
            query: {
                principalType: string;
                principalId: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        cloud: {
                            first_seen?: string | null;
                            last_seen?: string | null;
                            active_times: {
                                weekday: string;
                                hours: {
                                    start: string;
                                    end: string;
                                }[];
                                last_seen: string;
                            }[];
                            locations: {
                                location: string;
                                last_seen: string;
                            }[];
                            actions: {
                                action: string;
                                group: string;
                                event_count: number;
                                last_seen?: string | null;
                            }[];
                        } | null;
                        k8s: {
                            first_seen?: string | null;
                            last_seen?: string | null;
                            active_times: {
                                weekday: string;
                                hours: {
                                    start: string;
                                    end: string;
                                }[];
                                last_seen: string;
                            }[];
                            locations: {
                                location: string;
                                last_seen: string;
                            }[];
                            actions: {
                                action: string;
                                group: string;
                                event_count: number;
                                last_seen?: string | null;
                            }[];
                        } | null;
                        burn_in_days?: number | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-runtimeBaseline": {
        parameters: {
            query: {
                principalType: string;
                principalId: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        runtime?: {
                            images: {
                                image: string;
                                first_seen?: string | null;
                                last_seen?: string | null;
                                processes: {
                                    binary: string;
                                    first_seen?: string | null;
                                    last_seen?: string | null;
                                    parents: string[];
                                    cwds: string[];
                                    preloads: string[];
                                    function_names: string[];
                                }[];
                                file_operations: {
                                    process: string;
                                    binary_path?: string | null;
                                    operations: {
                                        operation: string;
                                        function_names: string[];
                                        file_paths: {
                                            path: string;
                                            first_seen?: string | null;
                                            last_seen?: string | null;
                                            file_flags?: string[];
                                        }[];
                                    }[];
                                }[];
                            }[];
                        } | null;
                        connections?: {
                            destinations: {
                                type: string;
                                target: string;
                                last_seen?: string | null;
                            }[];
                            first_seen?: string | null;
                            last_seen?: string | null;
                        } | null;
                        api_calls?: {
                            calls: {
                                direction: string;
                                host: string;
                                path: string;
                                process: string;
                                raw_host: string;
                                raw_path: string;
                                raw_process: string;
                                methods: string[];
                                first_seen?: string | null;
                                last_seen?: string | null;
                            }[];
                        } | null;
                        burn_in_days?: number | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-top": {
        parameters: {
            query?: {
                start_time?: string;
                end_time?: string;
                period?: "today" | "last2days" | "last7days" | "last14days" | "last30days";
                account_ids?: string[];
                anomaly_severity?: number[];
                limit?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                group_by: "accounts" | "signals" | "signal_names" | "resources";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        _id: {
                            key: string;
                            resource_type?: string;
                        };
                        keys: {
                            key: string;
                            severity: number;
                            count: number;
                            score: number;
                        }[];
                        totalCount: number;
                        totalScore: number;
                    }[];
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-setStatus": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    detections_ids: string[];
                    /** @enum {string} */
                    new_status: "open" | "in_progress" | "closed";
                    comment?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-setTriage": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description The _id of the detection to update triage for */
                    detection_id: string;
                    /**
                     * @description The recommended verdict for the detection
                     * @enum {string}
                     */
                    triage_recommended_verdict: "Benign" | "Suspicious" | "Malicious" | "Unknown";
                    /**
                     * @description Confidence level of the triage assessment
                     * @enum {string}
                     */
                    triage_confidence: "Low" | "Medium" | "High";
                    /** @description The verdict in 2-3 sentences. Max 1000 characters. Also stored as the detection notification summary. */
                    triage_summary: string;
                    /** @description Full evidence and analysis, rendered as markdown on the detection. Max 5000 characters. Send it whenever you have analysis to record: when omitted, whatever is already stored is left untouched, so a call without it cannot add analysis. Sending an empty string deliberately clears it. */
                    triage_reasoning?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-activities": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        detection_actions: ({
                            action_type: string;
                            _id: string;
                            timestamp: string;
                            comment?: string | null;
                            created_by?: string | null;
                            created_date?: string | null;
                            modified_date?: string | null;
                            modified_by?: string | null;
                            deleted_by?: string | null;
                            deleted_date?: string | null;
                            old_status?: string | null;
                            new_status?: string | null;
                            old_verdict?: string | null;
                            new_verdict?: string | null;
                            ticket_id?: string | null;
                            ticket_key?: string | null;
                            ticket_url?: string | null;
                            ticket_system_type?: ("jira" | "azure" | "youtrack" | "service_now") | null;
                            triage_recommended_verdict?: ("Benign" | "Suspicious" | "Malicious" | "Unknown") | null;
                            triage_confidence?: ("Low" | "Medium" | "High") | null;
                            triage_summary?: string | null;
                            triage_reasoning?: string | null;
                            triage_timestamp?: string | null;
                        } & {
                            [key: string]: unknown;
                        })[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-mttrMtta": {
        parameters: {
            query?: {
                account_id?: string[];
                period?: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        mttr: {
                            average_seconds: number;
                            trend: {
                                date: string;
                                value: number;
                            }[];
                        };
                        mtta: {
                            average_seconds: number;
                            trend: {
                                date: string;
                                value: number;
                            }[];
                        };
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-linkTicket": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Detection _id(s) to link the ticket to */
                    detection_ids: string[];
                    /** @description The ticket number/key (e.g. INC0010050, PROJ-123) */
                    ticket_key: string;
                    /** @description The full URL to the ticket in the external system */
                    ticket_url: string;
                    /**
                     * @description The type of ticket system
                     * @enum {string}
                     */
                    ticket_system_type: "service_now" | "jira" | "azure" | "youtrack";
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        linked_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-setVerdict": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    detection_ids: string[];
                    verdict: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated_count: number;
                        verdict: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-acknowledge": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    detections_ids: string[];
                    acknowledge: boolean;
                    reason?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detections-comment-create": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    detection_id: string;
                    /** @description The comment text. Max 2000 characters. */
                    comment: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            inserted_activity_id: string;
                        };
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detectionRules-list": {
        parameters: {
            query?: {
                skip?: number;
                limit?: number;
                sort_by?: string;
                sort_order?: number;
                text?: string;
                severity?: string;
                type?: string;
                enabled?: string;
                labels?: string;
                log_type?: string;
                created_by?: string;
                name?: string;
                _id?: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            _id: string;
                            name?: string | null;
                            created_at?: string;
                            modified_at?: string;
                            created_by?: string;
                            description?: string;
                            enabled?: boolean;
                            /** @enum {string} */
                            type?: "custom" | "identityml" | "predefined";
                            severity?: ("critical" | "high" | "medium" | "low" | "dynamic") | null;
                            labels?: string[] | null;
                            custom_config?: {
                                /** @enum {string} */
                                log_type?: "identity" | "network" | "audit" | "process" | "file" | "apis";
                                /** @enum {string} */
                                detection_field?: "source" | "destination";
                            };
                            identityml_config?: {
                                action?: string;
                                /** @enum {string} */
                                match_type?: "is" | "contains";
                            };
                            predefined_config?: {
                                type?: string;
                            };
                            notification_channels?: {
                                type: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                                subtype?: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                                id?: string;
                                recipients?: string[];
                            }[];
                        }[];
                        total: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detectionRules-details": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                detection_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        _id: string;
                        name?: string | null;
                        created_at?: string;
                        modified_at?: string;
                        created_by?: string;
                        description?: string;
                        enabled?: boolean;
                        /** @enum {string} */
                        type?: "custom" | "identityml" | "predefined";
                        severity?: ("critical" | "high" | "medium" | "low" | "dynamic") | null;
                        labels?: string[] | null;
                        custom_config?: {
                            /** @enum {string} */
                            log_type?: "identity" | "network" | "audit" | "process" | "file" | "apis";
                            /** @enum {string} */
                            detection_field?: "source" | "destination";
                        };
                        identityml_config?: {
                            action?: string;
                            /** @enum {string} */
                            match_type?: "is" | "contains";
                        };
                        predefined_config?: {
                            type?: string;
                        };
                        notification_channels?: {
                            type: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                            subtype?: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                            id?: string;
                            recipients?: string[];
                        }[];
                        condition?: {
                            main_filter?: {
                                /** @enum {string} */
                                operand: "and" | "or";
                                filters?: {
                                    field?: string;
                                    /** @enum {string} */
                                    match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                    value?: unknown;
                                    tag?: {
                                        key?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                        value?: string;
                                    };
                                    /** @enum {string} */
                                    operand?: "and" | "or";
                                    filters?: {
                                        field?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                        value?: unknown;
                                        tag?: {
                                            key?: string;
                                            /** @enum {string} */
                                            match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                            value?: string;
                                        };
                                    }[];
                                    comment?: string | null;
                                    created_by?: string | null;
                                    created_at?: string | null;
                                }[];
                            };
                            exclude?: {
                                /** @enum {string} */
                                operand: "and" | "or";
                                filters?: {
                                    field?: string;
                                    /** @enum {string} */
                                    match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                    value?: unknown;
                                    tag?: {
                                        key?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                        value?: string;
                                    };
                                    /** @enum {string} */
                                    operand?: "and" | "or";
                                    filters?: {
                                        field?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                        value?: unknown;
                                        tag?: {
                                            key?: string;
                                            /** @enum {string} */
                                            match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                            value?: string;
                                        };
                                    }[];
                                    comment?: string | null;
                                    created_by?: string | null;
                                    created_at?: string | null;
                                }[];
                            };
                        };
                        threshold_config?: {
                            time_window_sec: number;
                            time_window_unit?: ("seconds" | "minutes" | "hours" | "days") | null;
                            count_operator?: ("eq" | "gt" | "gte") | null;
                            log_count?: number | null;
                            distinct_field?: string | null;
                            distinct_operator?: ("eq" | "gt" | "gte") | null;
                            distinct_count?: number | null;
                        } | null;
                        sequence_config?: {
                            time_window_sec: number;
                            steps: {
                                filter?: {
                                    /** @enum {string} */
                                    operand: "and" | "or";
                                    filters?: {
                                        field?: string;
                                        /** @enum {string} */
                                        match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                        value?: unknown;
                                        tag?: {
                                            key?: string;
                                            /** @enum {string} */
                                            match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                            value?: string;
                                        };
                                        /** @enum {string} */
                                        operand?: "and" | "or";
                                        filters?: {
                                            field?: string;
                                            /** @enum {string} */
                                            match_type?: "is" | "is_not" | "contains" | "not_contains" | "regex" | "gte" | "lte" | "exists" | "not_exists" | "empty" | "not_empty";
                                            value?: unknown;
                                            tag?: {
                                                key?: string;
                                                /** @enum {string} */
                                                match_type?: "is" | "is_not" | "contains" | "not_contains" | "empty" | "not_empty" | "regex";
                                                value?: string;
                                            };
                                        }[];
                                        comment?: string | null;
                                        created_by?: string | null;
                                        created_at?: string | null;
                                    }[];
                                } | null;
                                log_count?: number | null;
                                distinct_field?: string | null;
                                distinct_count?: number | null;
                                operator?: ("and" | "or" | "followed_by") | null;
                            }[];
                        } | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detectionRules-create": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Rule name */
                    name: string;
                    /** @description Rule description */
                    description?: string | null;
                    /** @default true */
                    enabled?: boolean;
                    /**
                     * @default custom
                     * @enum {string}
                     */
                    type?: "custom" | "identityml" | "predefined";
                    /**
                     * @description Rule severity
                     * @enum {string}
                     */
                    severity: "critical" | "high" | "medium" | "low" | "dynamic";
                    /** @description Detection conditions — structured filter tree */
                    condition?: {
                        main_filter?: {
                            operand?: ("and" | "or") | null;
                            filters?: components["schemas"]["__schema0"][] | null;
                        } | null;
                        exclude?: {
                            operand?: ("and" | "or") | null;
                            filters?: components["schemas"]["__schema0"][] | null;
                        } | null;
                    } | null;
                    /** @description Labels/tags for the rule */
                    labels?: string[] | null;
                    /** @description Alert channels (slack/webhook/email) the rule notifies */
                    notification_channels?: {
                        type?: ("slack" | "webhook" | "email") | null;
                        id?: string | null;
                        recipients?: string[] | null;
                    }[] | null;
                    custom_config?: {
                        log_type?: ("identity" | "network" | "audit" | "process" | "file" | "apis") | null;
                        detection_field?: ("source" | "destination") | null;
                    } | null;
                    identityml_config?: {
                        action?: string | null;
                        match_type?: ("is" | "contains") | null;
                    } | null;
                    predefined_config?: {
                        type?: ("identity" | "network" | "audit" | "canary" | "process" | "file" | "apis" | "guard_duty" | "crowd_strike" | "sentinel_one" | "cortex" | "azure_defender" | "azure_identity_protection" | "security_command_center" | "ai_injection") | null;
                    } | null;
                    /** @description Threshold configuration for multi-event rules */
                    threshold_config?: {
                        /** @description Time window in seconds */
                        time_window_sec?: number | null;
                        time_window_unit?: ("seconds" | "minutes" | "hours" | "days") | null;
                        count_operator?: ("eq" | "gt" | "gte") | null;
                        /** @description Minimum matching events */
                        log_count?: number | null;
                        distinct_field?: string | null;
                        distinct_operator?: ("eq" | "gt" | "gte") | null;
                        distinct_count?: number | null;
                    } | null;
                    sequence_config?: {
                        time_window_sec?: number | null;
                        steps?: {
                            filter?: {
                                operand?: ("and" | "or") | null;
                                filters?: components["schemas"]["__schema0"][] | null;
                            } | null;
                            log_count?: number | null;
                            distinct_field?: string | null;
                            distinct_count?: number | null;
                            operator?: ("and" | "or" | "followed_by") | null;
                        }[] | null;
                    } | null;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        name: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detectionRules-delete": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                /** @description The _id of the detection rule to delete */
                rule_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                        rule_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detectionRules-modify": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                /** @description The _id of the detection rule to modify */
                rule_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Rule name */
                    name?: string | null;
                    /** @description Rule description */
                    description?: string | null;
                    /** @description Whether the rule is active */
                    enabled?: boolean | null;
                    type?: ("custom" | "identityml" | "predefined") | null;
                    /** @description Rule severity */
                    severity?: ("critical" | "high" | "medium" | "low" | "dynamic") | null;
                    /** @description Detection conditions — structured filter tree */
                    condition?: {
                        main_filter?: {
                            operand?: ("and" | "or") | null;
                            filters?: components["schemas"]["__schema0"][] | null;
                        } | null;
                        exclude?: {
                            operand?: ("and" | "or") | null;
                            filters?: components["schemas"]["__schema0"][] | null;
                        } | null;
                    } | null;
                    /** @description Labels/tags for the rule */
                    labels?: string[] | null;
                    /** @description Alert channels (slack/webhook/email) the rule notifies */
                    notification_channels?: {
                        type?: ("slack" | "webhook" | "email") | null;
                        id?: string | null;
                        recipients?: string[] | null;
                    }[] | null;
                    custom_config?: {
                        log_type?: ("identity" | "network" | "audit" | "process" | "file" | "apis") | null;
                        detection_field?: ("source" | "destination") | null;
                    } | null;
                    identityml_config?: {
                        action?: string | null;
                        match_type?: ("is" | "contains") | null;
                    } | null;
                    predefined_config?: {
                        type?: ("identity" | "network" | "audit" | "canary" | "process" | "file" | "apis" | "guard_duty" | "crowd_strike" | "sentinel_one" | "cortex" | "azure_defender" | "azure_identity_protection" | "security_command_center" | "ai_injection") | null;
                    } | null;
                    /** @description Threshold configuration for multi-event rules */
                    threshold_config?: {
                        /** @description Time window in seconds */
                        time_window_sec?: number | null;
                        time_window_unit?: ("seconds" | "minutes" | "hours" | "days") | null;
                        count_operator?: ("eq" | "gt" | "gte") | null;
                        /** @description Minimum matching events */
                        log_count?: number | null;
                        distinct_field?: string | null;
                        distinct_operator?: ("eq" | "gt" | "gte") | null;
                        distinct_count?: number | null;
                    } | null;
                    sequence_config?: {
                        time_window_sec?: number | null;
                        steps?: {
                            filter?: {
                                operand?: ("and" | "or") | null;
                                filters?: components["schemas"]["__schema0"][] | null;
                            } | null;
                            log_count?: number | null;
                            distinct_field?: string | null;
                            distinct_count?: number | null;
                            operator?: ("and" | "or" | "followed_by") | null;
                        }[] | null;
                    } | null;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                        rule_id: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detectionRules-addExclude": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                /** @description The _id of the detection rule to modify */
                rule_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description The single exclude entry to add */
                    exclude: components["schemas"]["__schema0"];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        success: boolean;
                        rule_id: string;
                        exclude_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detectionRules-previewMatches": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Detection rule ID. If provided, fetches the rule condition automatically. */
                    rule_id?: string;
                    /** @description Raw condition to preview. Use instead of rule_id to test a modified condition before saving. */
                    condition?: {
                        main_filter: {
                            operand?: ("and" | "or") | null;
                            filters?: components["schemas"]["__schema0"][] | null;
                        };
                        exclude?: {
                            operand?: ("and" | "or") | null;
                            filters?: components["schemas"]["__schema0"][] | null;
                        };
                    };
                    /**
                     * @description Log type to query. Required when using raw condition; auto-detected from rule when using rule_id.
                     * @enum {string}
                     */
                    log_type?: "identity" | "network" | "audit" | "process" | "file" | "apis";
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        total_count: number;
                        sample_activities: {
                            [key: string]: unknown;
                        }[];
                        error: string | null;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detectionRules-facets": {
        parameters: {
            query: {
                facet_field: string;
                text?: string;
                severity?: string;
                type?: string;
                enabled?: string;
                labels?: string;
                log_type?: string;
                created_by?: string;
                _id?: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        value?: unknown | null;
                        count: number;
                    }[];
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "detectionRules-bulkModify": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    filters: {
                        [key: string]: unknown;
                    };
                    changes: {
                        enabled?: boolean;
                        /** @enum {string} */
                        severity?: "critical" | "high" | "medium" | "low" | "dynamic";
                        notification_channels?: {
                            type: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                            subtype?: (("webhook" | "splunk" | "pagerduty" | "microsoftteams" | "opsgenie" | "logzio" | "googlecards" | "paloaltocortexxsiam" | "torq") | "slack") | "email";
                            id?: string;
                            recipients?: string[];
                        }[];
                        labels?: string[];
                    };
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        modified_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "responseActions-getOptions": {
        parameters: {
            query: {
                detectedResourceId: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        options: {
                            id: string;
                            name: string;
                            trigger_name?: string;
                            description: string;
                            code: string;
                            disabled_reason?: string;
                            caller_params_schema?: {
                                [key: string]: {
                                    description: string;
                                    /** @enum {string} */
                                    value_type: "string" | "integer" | "boolean" | "string_enum";
                                    enum?: string[];
                                    required: boolean;
                                };
                            };
                        }[];
                        is_remediation_stack_installed: boolean;
                        error?: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "responseActions-invoke": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    runbookId: string;
                    resourceId: string;
                    caller_params?: {
                        [key: string]: string;
                    };
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        resourceId: string;
                        exposed_runbook_inputs?: {
                            [key: string]: unknown;
                        };
                        exposed_resource_ids?: string[];
                        mutated_resource_ids?: string[];
                        runbook_name?: string;
                        aws_region?: string;
                        aws_account_id?: string;
                        execution_id?: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "agentActions-getOptions": {
        parameters: {
            query: {
                resourceId: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        options: {
                            /** @enum {string} */
                            action_type: "kill_process" | "suspend_process" | "resume_process" | "kill_container" | "pause_container" | "unpause_container" | "delete_pod" | "kill_network_connection" | "block_ip" | "unblock_ip" | "network_isolation" | "remove_network_isolation" | "quarantine_file" | "delete_file" | "run_script" | "block_dns" | "unblock_dns" | "firewall_state" | "firewall_flush" | "process_list" | "dns_state" | "dns_flush" | "list_containers";
                            display_name: string;
                            description: string;
                            parameter_schema: {
                                [key: string]: unknown;
                            };
                            disabled_reason?: string;
                        }[];
                        agent_connected: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "agentActions-invoke": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    actionType: string;
                    /** @default {} */
                    parameters?: {
                        [key: string]: unknown;
                    };
                    resourceId: string;
                    targetNode?: string;
                    targetClusterId?: string;
                    targetInstanceId?: string;
                    detectionId?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        status: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "agentActions-getHistory": {
        parameters: {
            query?: {
                resourceId?: string;
                detectionId?: string;
                actionType?: string;
                skip?: number;
                limit?: number;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            id: string;
                            action_type: string;
                            status: string;
                            created_at: string;
                            created_by: string;
                            target_node: string;
                            result?: {
                                message?: string | null;
                                node_name?: string | null;
                                started_at: string;
                                completed_at: string;
                            };
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "agentActions-cancel": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    actionId: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        status: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "agentActions-execReadOnlyShell": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    resourceId: string;
                    command: string;
                    containerName?: string;
                    detectionId?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        status: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "users-preferences-get": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        case_emails_enabled: boolean;
                        case_emails_assigned_enabled: boolean;
                        case_emails_reporter_enabled: boolean;
                        case_emails_assigned_assignment_enabled: boolean;
                        case_emails_assigned_comment_enabled: boolean;
                        case_emails_assigned_mention_enabled: boolean;
                        case_emails_assigned_status_enabled: boolean;
                        case_emails_assigned_severity_enabled: boolean;
                        case_emails_assigned_verdict_enabled: boolean;
                        case_emails_assigned_archived_enabled: boolean;
                        case_emails_reporter_assignment_enabled: boolean;
                        case_emails_reporter_comment_enabled: boolean;
                        case_emails_reporter_mention_enabled: boolean;
                        case_emails_reporter_status_enabled: boolean;
                        case_emails_reporter_verdict_enabled: boolean;
                        case_emails_reporter_archived_enabled: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "users-preferences-update": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    case_emails_enabled?: boolean;
                    case_emails_assigned_enabled?: boolean;
                    case_emails_reporter_enabled?: boolean;
                    case_emails_assigned_assignment_enabled?: boolean;
                    case_emails_assigned_comment_enabled?: boolean;
                    case_emails_assigned_mention_enabled?: boolean;
                    case_emails_assigned_status_enabled?: boolean;
                    case_emails_assigned_severity_enabled?: boolean;
                    case_emails_assigned_verdict_enabled?: boolean;
                    case_emails_assigned_archived_enabled?: boolean;
                    case_emails_reporter_assignment_enabled?: boolean;
                    case_emails_reporter_comment_enabled?: boolean;
                    case_emails_reporter_mention_enabled?: boolean;
                    case_emails_reporter_status_enabled?: boolean;
                    case_emails_reporter_verdict_enabled?: boolean;
                    case_emails_reporter_archived_enabled?: boolean;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        case_emails_enabled: boolean;
                        case_emails_assigned_enabled: boolean;
                        case_emails_reporter_enabled: boolean;
                        case_emails_assigned_assignment_enabled: boolean;
                        case_emails_assigned_comment_enabled: boolean;
                        case_emails_assigned_mention_enabled: boolean;
                        case_emails_assigned_status_enabled: boolean;
                        case_emails_assigned_severity_enabled: boolean;
                        case_emails_assigned_verdict_enabled: boolean;
                        case_emails_assigned_archived_enabled: boolean;
                        case_emails_reporter_assignment_enabled: boolean;
                        case_emails_reporter_comment_enabled: boolean;
                        case_emails_reporter_mention_enabled: boolean;
                        case_emails_reporter_status_enabled: boolean;
                        case_emails_reporter_verdict_enabled: boolean;
                        case_emails_reporter_archived_enabled: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "workloads-summary": {
        parameters: {
            query: {
                resource_id: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        detections: {
                            id: number;
                            source: string;
                            target: string;
                            host: string;
                            provider: string;
                            category: string;
                            usage_type: string;
                            operation: string;
                            model_hint: string;
                            framework: string;
                            confidence: number;
                            signals: string[];
                            count: number;
                            first_seen: string | null;
                            last_seen: string | null;
                            /** @default [] */
                            tools: {
                                name: string;
                                type: string;
                                /** @default  */
                                description: string;
                                /** @default false */
                                called: boolean;
                            }[];
                            /** @default [] */
                            mcp_servers: {
                                host: string;
                                /** @default  */
                                name: string;
                            }[];
                            /** @default [] */
                            prompt_names: string[];
                        }[];
                        summary: {
                            categories: string[];
                            providers: string[];
                            models: string[];
                            max_confidence: number;
                            connected_count: number;
                            hosted_count: number;
                            /** @default [] */
                            tools: {
                                name: string;
                                type: string;
                                /** @default  */
                                description: string;
                                /** @default false */
                                called: boolean;
                            }[];
                            /** @default [] */
                            mcp_servers: {
                                host: string;
                                /** @default  */
                                name: string;
                            }[];
                            /** @default [] */
                            prompt_names: string[];
                        };
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "workspaces-list": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id: string;
                        name?: string;
                        role?: string | null;
                    }[];
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-listCves": {
        parameters: {
            query?: {
                cve_id?: string;
                severity?: string;
                cvss_score?: number;
                cvss_score_operator?: "eq" | "gt" | "gte" | "lt";
                epss_score?: number;
                epss_score_operator?: "eq" | "gt" | "gte" | "lt";
                packages?: string;
                fix_available?: boolean;
                exploit_available?: boolean;
                cisa_kev?: boolean;
                source?: string;
                attack_vector_network?: boolean;
                high_epss?: boolean;
                account_id?: string;
                resource_id?: string;
                resource_type?: string;
                region?: string;
                availability_zones?: string;
                namespace?: string;
                eks_cluster?: string;
                ecs_cluster?: string;
                subnet?: string;
                vpc?: string;
                cluster_id?: string;
                namespace_id?: string;
                container_images?: string;
                internet_exposed?: boolean;
                high_exposure_risk?: boolean;
                risk_focus_enabled?: boolean;
                sort_by?: string;
                sort_order?: "asc" | "desc";
                skip?: number;
                limit?: number;
                includeExcluded?: boolean;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            cve_id: string;
                            cve_id_int?: number;
                            /** @enum {string} */
                            severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
                            severity_numeric: number;
                            description: string | null;
                            cvss_score: number | null;
                            epss_score: number | null;
                            cisa_kev?: unknown | null;
                            cwes: unknown[] | null;
                            impact_score: number | null;
                            exploitability_score: number | null;
                            cvss_scoring_vector: string | null;
                            packages: string[];
                            fixed_in_versions: string[] | null;
                            file_paths: string[] | null;
                            fix_available: boolean | null;
                            exploit_available: boolean | null;
                            cve_sources: string[];
                            fixed_in_version: string | null;
                            published_date: string | null;
                            discovery_timestamp: string | null;
                            remediation: string | null;
                            package_manager: string | null;
                            attack_vector: string | null;
                            attack_complexity: string | null;
                            privileges_required: string | null;
                            user_interaction: string | null;
                            scope: string | null;
                            confidentiality: string | null;
                            integrity: string | null;
                            availability: string | null;
                            cvss_version: string | null;
                            affected_resources_count: number | null;
                            affected_images_count: number | null;
                            internet_exposed: boolean | null;
                            container_images: string[] | null;
                            high_exposure_risk: boolean | null;
                            runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE") | null;
                            exposure_risk: string | null;
                            exposure_risk_description: string[] | null;
                            excluded?: boolean;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-listCvesPost": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    filters?: {
                        cve_id?: string[];
                        severity?: ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN")[];
                        cvss_score?: {
                            value: number;
                            /**
                             * @default eq
                             * @enum {string}
                             */
                            operator?: "eq" | "gt" | "gte" | "lt";
                        };
                        epss_score?: {
                            value: number;
                            /**
                             * @default eq
                             * @enum {string}
                             */
                            operator?: "eq" | "gt" | "gte" | "lt";
                        };
                        packages?: string[];
                        fix_available?: boolean;
                        exploit_available?: boolean;
                        cisa_kev?: boolean;
                        source?: string[];
                        attack_vector_network?: boolean;
                        high_epss?: boolean;
                        account_id?: string[];
                        resource_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        availability_zones?: string[];
                        namespace?: string[];
                        eks_cluster?: string[];
                        ecs_cluster?: string[];
                        subnet?: string[];
                        vpc?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        container_images?: string[];
                        internet_exposed?: boolean;
                        high_exposure_risk?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                        risk_focus_enabled?: boolean;
                        tags?: {
                            /** @enum {string} */
                            logic_operand?: "and" | "or";
                            tag_filters?: {
                                key?: string;
                                /** @enum {string} */
                                key_operand?: "equals" | "contains";
                                value?: string;
                                /** @enum {string} */
                                value_operand?: "equals" | "contains";
                            }[];
                        }[];
                    };
                    /** @default cvss_score */
                    sort_by?: string;
                    /** @enum {string} */
                    sort_order?: "asc" | "desc";
                    /** @default 0 */
                    skip?: number;
                    /** @default 50 */
                    limit?: number;
                    /** @default false */
                    includeExcluded?: boolean;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            cve_id: string;
                            cve_id_int?: number;
                            /** @enum {string} */
                            severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
                            severity_numeric: number;
                            description: string | null;
                            cvss_score: number | null;
                            epss_score: number | null;
                            cisa_kev?: unknown | null;
                            cwes: unknown[] | null;
                            impact_score: number | null;
                            exploitability_score: number | null;
                            cvss_scoring_vector: string | null;
                            packages: string[];
                            fixed_in_versions: string[] | null;
                            file_paths: string[] | null;
                            fix_available: boolean | null;
                            exploit_available: boolean | null;
                            cve_sources: string[];
                            fixed_in_version: string | null;
                            published_date: string | null;
                            discovery_timestamp: string | null;
                            remediation: string | null;
                            package_manager: string | null;
                            attack_vector: string | null;
                            attack_complexity: string | null;
                            privileges_required: string | null;
                            user_interaction: string | null;
                            scope: string | null;
                            confidentiality: string | null;
                            integrity: string | null;
                            availability: string | null;
                            cvss_version: string | null;
                            affected_resources_count: number | null;
                            affected_images_count: number | null;
                            internet_exposed: boolean | null;
                            container_images: string[] | null;
                            high_exposure_risk: boolean | null;
                            runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE") | null;
                            exposure_risk: string | null;
                            exposure_risk_description: string[] | null;
                            excluded?: boolean;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-exportCves": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    filters?: {
                        cve_id?: string[];
                        severity?: ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN")[];
                        cvss_score?: {
                            value: number;
                            /**
                             * @default eq
                             * @enum {string}
                             */
                            operator?: "eq" | "gt" | "gte" | "lt";
                        };
                        epss_score?: {
                            value: number;
                            /**
                             * @default eq
                             * @enum {string}
                             */
                            operator?: "eq" | "gt" | "gte" | "lt";
                        };
                        packages?: string[];
                        fix_available?: boolean;
                        exploit_available?: boolean;
                        cisa_kev?: boolean;
                        source?: string[];
                        attack_vector_network?: boolean;
                        high_epss?: boolean;
                        account_id?: string[];
                        resource_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        availability_zones?: string[];
                        namespace?: string[];
                        eks_cluster?: string[];
                        ecs_cluster?: string[];
                        subnet?: string[];
                        vpc?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        container_images?: string[];
                        internet_exposed?: boolean;
                        high_exposure_risk?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                        risk_focus_enabled?: boolean;
                        tags?: {
                            /** @enum {string} */
                            logic_operand?: "and" | "or";
                            tag_filters?: {
                                key?: string;
                                /** @enum {string} */
                                key_operand?: "equals" | "contains";
                                value?: string;
                                /** @enum {string} */
                                value_operand?: "equals" | "contains";
                            }[];
                        }[];
                    };
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        filename: string;
                        content: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-exportCveResources": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @default {} */
                    filters?: {
                        cve_ids?: string[];
                        account_id?: string[];
                        resource_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        vpc?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        controller_id?: string[];
                        controller_kind?: string[];
                        container_images?: string[];
                        package?: string[];
                        internet_exposed?: boolean;
                        high_exposure_risk?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                        fix_available?: boolean;
                        tags?: {
                            /** @enum {string} */
                            logic_operand?: "and" | "or";
                            tag_filters?: {
                                key?: string;
                                /** @enum {string} */
                                key_operand?: "equals" | "contains";
                                value?: string;
                                /** @enum {string} */
                                value_operand?: "equals" | "contains";
                            }[];
                        }[];
                    };
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        filename: string;
                        content: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-exportCveImages": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @default {} */
                    filters?: {
                        cve_ids?: string[];
                        image_id?: string[];
                        account_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        package?: string[];
                        internet_exposed?: boolean;
                        fix_available?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                    };
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        filename: string;
                        content: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-listFacets": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    field: "cve_id" | "packages" | "resource_id" | "resource_tag_key" | "resource_tag_value" | "container_images";
                    phrase?: string;
                    /** @default 0 */
                    skip?: number;
                    /** @default 10 */
                    limit?: number;
                    tag_key?: string;
                    filters?: {
                        cve_id?: string[];
                        severity?: ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN")[];
                        cvss_score?: {
                            value: number;
                            /**
                             * @default eq
                             * @enum {string}
                             */
                            operator?: "eq" | "gt" | "gte" | "lt";
                        };
                        epss_score?: {
                            value: number;
                            /**
                             * @default eq
                             * @enum {string}
                             */
                            operator?: "eq" | "gt" | "gte" | "lt";
                        };
                        packages?: string[];
                        fix_available?: boolean;
                        exploit_available?: boolean;
                        cisa_kev?: boolean;
                        source?: string[];
                        attack_vector_network?: boolean;
                        high_epss?: boolean;
                        account_id?: string[];
                        resource_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        availability_zones?: string[];
                        namespace?: string[];
                        eks_cluster?: string[];
                        ecs_cluster?: string[];
                        subnet?: string[];
                        vpc?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        container_images?: string[];
                        internet_exposed?: boolean;
                        high_exposure_risk?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                        risk_focus_enabled?: boolean;
                        tags?: {
                            /** @enum {string} */
                            logic_operand?: "and" | "or";
                            tag_filters?: {
                                key?: string;
                                /** @enum {string} */
                                key_operand?: "equals" | "contains";
                                value?: string;
                                /** @enum {string} */
                                value_operand?: "equals" | "contains";
                            }[];
                        }[];
                    };
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: string[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-getCveTrends": {
        parameters: {
            query?: {
                cve_id?: string;
                severity?: string;
                account_id?: string;
                fix_available?: boolean;
                exploit_available?: boolean;
                cisa_kev?: boolean;
                attack_vector_network?: boolean;
                high_epss?: boolean;
                internet_exposed?: boolean;
                risk_focus_enabled?: boolean;
                sources?: string;
                packages?: string;
                group_by?: "severity" | "cve_id" | "account";
                period?: "past_week" | "past_2_weeks" | "past_month" | "past_3_months" | "past_6_months" | "past_year";
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            day: string;
                            value: number;
                            severity?: number;
                            cve_id?: string;
                            account?: string;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-getCveTrendsPost": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    filters?: {
                        cve_id?: string[];
                        severity?: ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN")[];
                        account_id?: string[];
                        fix_available?: boolean;
                        exploit_available?: boolean;
                        cisa_kev?: boolean;
                        attack_vector_network?: boolean;
                        high_epss?: boolean;
                        internet_exposed?: boolean;
                        risk_focus_enabled?: boolean;
                        sources?: string[];
                        packages?: string[];
                    };
                    /**
                     * @default severity
                     * @enum {string}
                     */
                    group_by?: "severity" | "cve_id" | "account";
                    /**
                     * @default past_month
                     * @enum {string}
                     */
                    period?: "past_week" | "past_2_weeks" | "past_month" | "past_3_months" | "past_6_months" | "past_year";
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            day: string;
                            value: number;
                            severity?: number;
                            cve_id?: string;
                            account?: string;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-getCveSeveritySummary": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    filters?: {
                        cve_id?: string[];
                        severity?: ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN")[];
                        cvss_score?: {
                            value: number;
                            /**
                             * @default eq
                             * @enum {string}
                             */
                            operator?: "eq" | "gt" | "gte" | "lt";
                        };
                        epss_score?: {
                            value: number;
                            /**
                             * @default eq
                             * @enum {string}
                             */
                            operator?: "eq" | "gt" | "gte" | "lt";
                        };
                        packages?: string[];
                        fix_available?: boolean;
                        exploit_available?: boolean;
                        cisa_kev?: boolean;
                        source?: string[];
                        attack_vector_network?: boolean;
                        high_epss?: boolean;
                        account_id?: string[];
                        resource_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        availability_zones?: string[];
                        namespace?: string[];
                        eks_cluster?: string[];
                        ecs_cluster?: string[];
                        subnet?: string[];
                        vpc?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        container_images?: string[];
                        internet_exposed?: boolean;
                        high_exposure_risk?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                        risk_focus_enabled?: boolean;
                        tags?: {
                            /** @enum {string} */
                            logic_operand?: "and" | "or";
                            tag_filters?: {
                                key?: string;
                                /** @enum {string} */
                                key_operand?: "equals" | "contains";
                                value?: string;
                                /** @enum {string} */
                                value_operand?: "equals" | "contains";
                            }[];
                        }[];
                    };
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            severity: number;
                            count: number;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-listCveResources": {
        parameters: {
            query?: {
                cve_ids?: string;
                account_id?: string;
                resource_id?: string;
                resource_type?: string;
                region?: string;
                vpc?: string;
                cluster_id?: string;
                namespace_id?: string;
                controller_id?: string;
                controller_kind?: string;
                container_images?: string;
                package?: string;
                internet_exposed?: boolean;
                high_exposure_risk?: boolean;
                skip?: number;
                limit?: number;
                includeExcluded?: boolean;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            resource_id: string;
                            resource_type: string | null;
                            account_id: string | null;
                            region: string | null;
                            cluster_id: string | null;
                            namespace_id: string | null;
                            controller_id: string | null;
                            controller_kind: string | null;
                            display_name: string | null;
                            container_images: string[] | null;
                            packages: {
                                package_version: string | null;
                                fixed_in_version: string | null;
                                file_path: string | null;
                            }[] | null;
                            internet_exposed: boolean | null;
                            exposure_risk: string | null;
                            exposure_risk_description: string[] | null;
                            runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE") | null;
                            child_resources: {
                                resource_id: string;
                                resource_type: string | null;
                                display_name: string | null;
                                account_id: string | null;
                                region: string | null;
                                cluster_id: string | null;
                                namespace_id: string | null;
                                container_images: string[] | null;
                                packages: {
                                    package_version: string | null;
                                    fixed_in_version: string | null;
                                    file_path: string | null;
                                }[] | null;
                                internet_exposed: boolean | null;
                                exposure_risk: string | null;
                                exposure_risk_description: string[] | null;
                                runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE") | null;
                            }[] | null;
                            excluded?: boolean;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-listCveResourcesPost": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @default {} */
                    filters?: {
                        cve_ids?: string[];
                        account_id?: string[];
                        resource_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        vpc?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        controller_id?: string[];
                        controller_kind?: string[];
                        container_images?: string[];
                        package?: string[];
                        internet_exposed?: boolean;
                        high_exposure_risk?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                        fix_available?: boolean;
                        tags?: {
                            /** @enum {string} */
                            logic_operand?: "and" | "or";
                            tag_filters?: {
                                key?: string;
                                /** @enum {string} */
                                key_operand?: "equals" | "contains";
                                value?: string;
                                /** @enum {string} */
                                value_operand?: "equals" | "contains";
                            }[];
                        }[];
                    };
                    /** @default 0 */
                    skip?: number;
                    /** @default 50 */
                    limit?: number;
                    /** @default false */
                    includeExcluded?: boolean;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            resource_id: string;
                            resource_type: string | null;
                            account_id: string | null;
                            region: string | null;
                            cluster_id: string | null;
                            namespace_id: string | null;
                            controller_id: string | null;
                            controller_kind: string | null;
                            display_name: string | null;
                            container_images: string[] | null;
                            packages: {
                                package_version: string | null;
                                fixed_in_version: string | null;
                                file_path: string | null;
                            }[] | null;
                            internet_exposed: boolean | null;
                            exposure_risk: string | null;
                            exposure_risk_description: string[] | null;
                            runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE") | null;
                            child_resources: {
                                resource_id: string;
                                resource_type: string | null;
                                display_name: string | null;
                                account_id: string | null;
                                region: string | null;
                                cluster_id: string | null;
                                namespace_id: string | null;
                                container_images: string[] | null;
                                packages: {
                                    package_version: string | null;
                                    fixed_in_version: string | null;
                                    file_path: string | null;
                                }[] | null;
                                internet_exposed: boolean | null;
                                exposure_risk: string | null;
                                exposure_risk_description: string[] | null;
                                runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE") | null;
                            }[] | null;
                            excluded?: boolean;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-listCveResourcesGrouped": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @default {} */
                    filters?: {
                        cve_ids?: string[];
                        account_id?: string[];
                        resource_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        vpc?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        controller_id?: string[];
                        controller_kind?: string[];
                        container_images?: string[];
                        package?: string[];
                        internet_exposed?: boolean;
                        high_exposure_risk?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                        fix_available?: boolean;
                        tags?: {
                            /** @enum {string} */
                            logic_operand?: "and" | "or";
                            tag_filters?: {
                                key?: string;
                                /** @enum {string} */
                                key_operand?: "equals" | "contains";
                                value?: string;
                                /** @enum {string} */
                                value_operand?: "equals" | "contains";
                            }[];
                        }[];
                    };
                    /** @enum {string} */
                    group_by: "account_id" | "resource_type" | "cluster_id" | "namespace_id" | "region" | "container_images" | "package";
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            group_key: string | null;
                            total_count: number;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-listCveImages": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @default {} */
                    filters?: {
                        cve_ids?: string[];
                        image_id?: string[];
                        account_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        package?: string[];
                        internet_exposed?: boolean;
                        fix_available?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                    };
                    /** @default 0 */
                    skip?: number;
                    /** @default 50 */
                    limit?: number;
                    /** @default false */
                    includeExcluded?: boolean;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            image_id: string;
                            registry_id: string | null;
                            repository_id: string | null;
                            image_type: string | null;
                            affected_resources_count: number;
                            internet_exposed: boolean | null;
                            cluster_ids: string[] | null;
                            namespace_ids: string[] | null;
                            packages: {
                                package_version: string | null;
                                fixed_in_version: string | null;
                                file_path: string | null;
                            }[] | null;
                            high_exposure_risk: boolean | null;
                            exposure_risk: string | null;
                            exposure_risk_description: string[] | null;
                            runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE") | null;
                            excluded?: boolean;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-listCvesGrouped": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    filters?: {
                        cve_id?: string[];
                        severity?: ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN")[];
                        cvss_score?: {
                            value: number;
                            /**
                             * @default eq
                             * @enum {string}
                             */
                            operator?: "eq" | "gt" | "gte" | "lt";
                        };
                        epss_score?: {
                            value: number;
                            /**
                             * @default eq
                             * @enum {string}
                             */
                            operator?: "eq" | "gt" | "gte" | "lt";
                        };
                        packages?: string[];
                        fix_available?: boolean;
                        exploit_available?: boolean;
                        cisa_kev?: boolean;
                        source?: string[];
                        attack_vector_network?: boolean;
                        high_epss?: boolean;
                        account_id?: string[];
                        resource_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        availability_zones?: string[];
                        namespace?: string[];
                        eks_cluster?: string[];
                        ecs_cluster?: string[];
                        subnet?: string[];
                        vpc?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        container_images?: string[];
                        internet_exposed?: boolean;
                        high_exposure_risk?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                        risk_focus_enabled?: boolean;
                        tags?: {
                            /** @enum {string} */
                            logic_operand?: "and" | "or";
                            tag_filters?: {
                                key?: string;
                                /** @enum {string} */
                                key_operand?: "equals" | "contains";
                                value?: string;
                                /** @enum {string} */
                                value_operand?: "equals" | "contains";
                            }[];
                        }[];
                    };
                    /**
                     * @default packages
                     * @enum {string}
                     */
                    group_by?: "packages" | "container_images";
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            group_key: string | null;
                            total_count: number;
                            total_exploitable: number;
                            severities: {
                                severity: number;
                                total_count: number;
                            }[];
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-listResourceFacets": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    field: "account_id" | "resource_type" | "region" | "resource_id" | "vpc" | "cluster_id" | "namespace_id" | "container_images" | "ticket_id" | "package" | "resource_tag_key" | "resource_tag_value";
                    phrase?: string;
                    /** @default 0 */
                    skip?: number;
                    /** @default 10 */
                    limit?: number;
                    filters?: {
                        cve_ids?: string[];
                        account_id?: string[];
                        resource_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        vpc?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        controller_id?: string[];
                        controller_kind?: string[];
                        container_images?: string[];
                        package?: string[];
                        internet_exposed?: boolean;
                        high_exposure_risk?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                        fix_available?: boolean;
                        tags?: {
                            /** @enum {string} */
                            logic_operand?: "and" | "or";
                            tag_filters?: {
                                key?: string;
                                /** @enum {string} */
                                key_operand?: "equals" | "contains";
                                value?: string;
                                /** @enum {string} */
                                value_operand?: "equals" | "contains";
                            }[];
                        }[];
                    };
                    tag_key?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: (string | null)[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-resourceTicketFacets": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    phrase?: string;
                    /** @default 0 */
                    skip?: number;
                    /** @default 10 */
                    limit?: number;
                    filters?: {
                        cve_ids?: string[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: (string | null)[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-listImageFacets": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    field: "image_id" | "image_type" | "registry_id" | "repository_id" | "account_id" | "cluster_ids" | "namespace_ids" | "ticket_id" | "package";
                    phrase?: string;
                    /** @default 0 */
                    skip?: number;
                    /** @default 10 */
                    limit?: number;
                    filters?: {
                        cve_ids?: string[];
                        image_id?: string[];
                        account_id?: string[];
                        resource_type?: string[];
                        region?: string[];
                        cluster_id?: string[];
                        namespace_id?: string[];
                        package?: string[];
                        internet_exposed?: boolean;
                        fix_available?: boolean;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                        runtime_loaded?: boolean;
                    };
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: (string | null)[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-getAiSummary": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                cve_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        summary: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-getCve": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path: {
                cve_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        cve_id: string;
                        cve_id_int?: number;
                        /** @enum {string} */
                        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
                        severity_numeric: number;
                        description: string | null;
                        cvss_score: number | null;
                        epss_score: number | null;
                        cisa_kev?: unknown | null;
                        cwes: unknown[] | null;
                        impact_score: number | null;
                        exploitability_score: number | null;
                        cvss_scoring_vector: string | null;
                        packages: string[];
                        fixed_in_versions: string[] | null;
                        file_paths: string[] | null;
                        fix_available: boolean | null;
                        exploit_available: boolean | null;
                        cve_sources: string[];
                        fixed_in_version: string | null;
                        published_date: string | null;
                        discovery_timestamp: string | null;
                        remediation: string | null;
                        package_manager: string | null;
                        attack_vector: string | null;
                        attack_complexity: string | null;
                        privileges_required: string | null;
                        user_interaction: string | null;
                        scope: string | null;
                        confidentiality: string | null;
                        integrity: string | null;
                        availability: string | null;
                        cvss_version: string | null;
                        affected_resources_count: number | null;
                        affected_images_count: number | null;
                        internet_exposed: boolean | null;
                        container_images: string[] | null;
                        high_exposure_risk: boolean | null;
                        runtime_status?: ("EXECUTED" | "LOADED" | "NOT_IN_USE") | null;
                        exposure_risk: string | null;
                        exposure_risk_description: string[] | null;
                        excluded?: boolean;
                    } | null;
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-exclusions-specific-query": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    cveId?: number;
                    subjectId?: string;
                    /** @default 0 */
                    skip?: number;
                    /** @default 50 */
                    limit?: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            /** Format: uuid */
                            id: string;
                            cveIdInt: number;
                            /** @enum {string} */
                            subjectKind: "resource" | "image";
                            subjectId: string;
                            userName: string;
                            comment: string;
                            /** Format: date-time */
                            exclusionDate: string;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-exclusions-specific-add": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    cveId: number;
                    subjects: {
                        /** @enum {string} */
                        kind: "resource" | "image";
                        id: string;
                    }[];
                    comment: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        insertedIds: string[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-exclusions-specific-delete": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    exclusionIds: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        deletedCount: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-exclusions-specific-countByCveId": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        counts: {
                            cveIdInt: number;
                            count: number;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-exclusions-cve-query": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @default 0 */
                    skip?: number;
                    /** @default 50 */
                    limit?: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            /** Format: uuid */
                            id: string;
                            cveIdInt: number;
                            cveId: string | null;
                            severity: number | null;
                            userName: string;
                            comment: string;
                            /** Format: date-time */
                            exclusionDate: string;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-exclusions-cve-add": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    cveIds: number[];
                    comment: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        insertedIds: string[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "cve-exclusions-cve-delete": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    exclusionIds: string[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        deletedCount: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "sbom-listPackages": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    filters?: {
                        /** @description Free-text over package name (pg_trgm). Max 200 characters. */
                        search?: string;
                        ecosystems?: string[];
                        licenses?: string[];
                        resource_types?: string[];
                        account_ids?: string[];
                        has_cves?: boolean;
                        runtime_statuses?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                    };
                    /**
                     * @default cve_count
                     * @enum {string}
                     */
                    sort_by?: "name" | "installed_count" | "cve_count" | "first_seen";
                    /**
                     * @default desc
                     * @enum {string}
                     */
                    sort_order?: "asc" | "desc";
                    /** @default 0 */
                    skip?: number;
                    /** @default 50 */
                    limit?: number;
                    /** @default false */
                    group_by_name?: boolean;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            package_id: string;
                            name: string;
                            version: string | null;
                            ecosystem: string | null;
                            language: string | null;
                            licenses: string[];
                            purl: string | null;
                            installed_count: number;
                            executed_count: number;
                            loaded_count: number;
                            not_in_use_count: number;
                            unknown_count: number;
                            cve_count: number;
                            critical_count: number;
                            high_count: number;
                            medium_count: number;
                            low_count: number;
                            image_count: number;
                            version_count: number;
                            name_cve_count: number;
                            name_max_severity: number;
                            cpe: string | null;
                            file_paths: string[];
                            first_seen: number | null;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "sbom-listPackageResources": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    package_id: string;
                    /** @default 0 */
                    skip?: number;
                    /** @default 50 */
                    limit?: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            workload_id: string;
                            resource_id: string;
                            controller_kind: string | null;
                            resource_count: number;
                            display_name: string | null;
                            resource_type: string | null;
                            account_id: string | null;
                            region: string | null;
                            image_name: string | null;
                            /** @enum {string} */
                            runtime_status: "EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN";
                            locations: string[];
                            first_seen: number | null;
                            last_seen_scan: number | null;
                            scan_status: string;
                            cve_count: number;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "sbom-listPackageVulnerabilities": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    package_id: string;
                    /** @default 0 */
                    skip?: number;
                    /** @default 50 */
                    limit?: number;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        results: {
                            cve_id: string;
                            severity: ("critical" | "high" | "medium" | "low") | null;
                            score: number | null;
                            epss_score: number | null;
                            exploit_available: boolean;
                            fix_available: boolean;
                            fixed_in_version: string | null;
                            description: string | null;
                            attack_vector: string | null;
                            resource_count: number;
                            first_detected_at: string | null;
                        }[];
                        total_count: number;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "sbom-coverage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        scanned_resources: number;
                        scannable_resources: number;
                        total_packages: number;
                        packages_with_cves: number;
                        packages_loaded_at_runtime: number;
                        last_scan_at: number | null;
                    };
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "sbom-exportPackages": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    filters?: {
                        /** @description Free-text over package name (pg_trgm). Max 200 characters. */
                        search?: string;
                        ecosystems?: string[];
                        licenses?: string[];
                        resource_types?: string[];
                        account_ids?: string[];
                        has_cves?: boolean;
                        runtime_statuses?: ("EXECUTED" | "LOADED" | "NOT_IN_USE" | "UNKNOWN")[];
                    };
                    /**
                     * @default cve_count
                     * @enum {string}
                     */
                    sort_by?: "name" | "installed_count" | "cve_count" | "first_seen";
                    /**
                     * @default desc
                     * @enum {string}
                     */
                    sort_order?: "asc" | "desc";
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        filename: string;
                        content: string;
                        row_count: number;
                        truncated: boolean;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "aev-resolveTarget": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description ID of the VULNERABLE asset itself (the resource the internet_exposed finding names) — e.g. the EC2 instance, pod, or Lambda, never a fronting load balancer / API Gateway / CDN. This resolver auto-discovers the fronting edge from the attack-path graph and probes through it; passing the fronting edge’s own ID instead returns in_scope:false (it rarely carries the finding itself). */
                    resource_id: string;
                    /** @description Slug of the AEV plugin that will run the probe (its 24-hex plugin id is also accepted as a fallback). The grant is signed with that plugin’s key so only it can use the grant. */
                    plugin_slug: string;
                    /** @description Synthetic test identities for authenticated breach validation. Omit for unauthenticated probing. Do NOT pass a real production credential — these are for scoped test identities only. */
                    auth_contexts?: {
                        /** @description Name the probe references this identity by (e.g. "user_a", "admin"). "anonymous" is reserved for sending no auth and needs no entry. */
                        label: string;
                        /** @description Headers the probe attaches to the target request for this identity, e.g. {"Authorization":"Bearer …"} or a session {"Cookie":"…"}. */
                        headers: {
                            [key: string]: string;
                        };
                    }[];
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        in_scope: boolean;
                        reason?: string;
                        hint?: string;
                        resource_id: string;
                        resource_type?: string;
                        account_id?: string;
                        target?: {
                            host: string;
                            /** @enum {string} */
                            source: "public_address" | "addresses" | "public_ip" | "dns_name" | "fronting_lb" | "fronting_api_gateway" | "fronting_edge";
                            fronting_lb_resource_id?: string;
                            routing_hint?: string;
                            path_prefixes?: string[];
                            candidate_ips: string[];
                            expected_ports: number[];
                        };
                        grant?: string;
                        auth_context_labels?: string[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "aev-mintOobToken": {
        parameters: {
            query?: never;
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Public host the target should call back to. Optional — defaults to the request host. */
                    callback_host?: string;
                };
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        token: string;
                        callback_host?: string;
                        callback_url?: string;
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
    "aev-pollInteraction": {
        parameters: {
            query: {
                token: string;
            };
            header?: {
                /** @description Workspace ID */
                workspace?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        token: string;
                        hit: boolean;
                        interactions: {
                            src_ip: string;
                            method: string;
                            path: string;
                            received_at: string;
                        }[];
                    };
                };
            };
            /** @description Invalid input data */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.BAD_REQUEST"];
                };
            };
            /** @description Authorization not provided */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.UNAUTHORIZED"];
                };
            };
            /** @description Insufficient access */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.FORBIDDEN"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.NOT_FOUND"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error.INTERNAL_SERVER_ERROR"];
                };
            };
        };
    };
}
