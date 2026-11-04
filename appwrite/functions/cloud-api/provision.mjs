import { readFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import { createAppwriteRest } from './src/appwrite-store.js';

// Deliberately opt-in: running without --apply prints the required resource plan only.
const schema = JSON.parse(await readFile(new URL('../../schema.json', import.meta.url), 'utf8'));
if (!process.argv.includes('--apply')) {
    process.stdout.write(JSON.stringify({ database: schema.database.databaseId, tables: schema.tables.map(t => t.tableId), apply: 'Set server environment credentials and rerun with --apply.' }, null, 2) + '\n');
} else {
    const request = createAppwriteRest({ endpoint: process.env.APPWRITE_FUNCTION_API_ENDPOINT, projectId: process.env.APPWRITE_FUNCTION_PROJECT_ID, apiKey: process.env.APPWRITE_API_KEY });
    const dbPath = '/tablesdb/' + encodeURIComponent(schema.database.databaseId);
    try { await request('POST', '/tablesdb', schema.database); }
    catch (error) { if (!error.appwrite || error.status !== 409) throw error; }
    for (const table of schema.tables) {
        const tablePath = dbPath + '/tables/' + encodeURIComponent(table.tableId);
        try { await request('POST', dbPath + '/tables', table); }
        catch (error) { if (!error.appwrite || error.status !== 409) throw error; }
        let actual;
        for (let attempt = 0; attempt < 30; attempt++) {
            actual = await request('GET', tablePath);
            if (actual.columns?.every(c => !c.status || c.status === 'available')) break;
            await pause(500);
        }
        if (!actual.rowSecurity || actual.$permissions?.length || actual.permissions?.length) throw new Error('Unsafe existing table permissions: ' + table.tableId);
        for (const column of table.columns) {
            const existing = actual.columns?.find(c => c.key === column.key);
            if (!existing || (existing.status && existing.status !== 'available') || existing.type !== column.type || existing.required !== column.required || (column.size && existing.size !== column.size)) throw new Error('Schema mismatch or unavailable column: ' + table.tableId + '.' + column.key);
        }
        for (const index of table.indexes) {
            const existing = actual.indexes?.find(i => i.key === index.key);
            if (!existing || (existing.status && existing.status !== 'available')) throw new Error('Index not ready: ' + table.tableId + '.' + index.key);
        }
    }
    for (const seed of schema.seed) {
        // Never reset live usage counters when provisioning again.
        try { await request('GET', dbPath + '/tables/' + seed.tableId + '/rows/' + seed.rowId); }
        catch (error) {
            if (!error.appwrite || error.status !== 404) throw error;
            await request('POST', dbPath + '/tables/' + seed.tableId + '/rows', { rowId: seed.rowId, data: seed.data, permissions: seed.permissions });
        }
    }
    process.stdout.write('Cloud schema verified. Cloud writes remain controlled by MARKUPS_CLOUD_ENABLED and the pilot allowlist.\n');
}
