import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DatabasePortalPage } from '../pages/database/DatabasePortalPage';
import { databaseApi } from '../services/databaseApi';

vi.mock('../services/databaseApi', () => ({
  databaseApi: {
    getOverview: vi.fn(),
    getTables: vi.fn(),
    getTableDetail: vi.fn(),
    getRelationships: vi.fn(),
    getViews: vi.fn(),
    getViewDetail: vi.fn(),
    getFunctions: vi.fn(),
    getTriggers: vi.fn(),
    getIndexes: vi.fn(),
    getStatistics: vi.fn(),
    getQueries: vi.fn(),
    executeQuery: vi.fn(),
    getExports: vi.fn(),
    getExportDownloadUrl: vi.fn((file: string) => `http://localhost:8000/api/v1/database/exports/download/${file}`),
  },
}));

const mockOverview = {
  engine: 'PostgreSQL 18.6',
  database_name: 'eventhub',
  table_count: 16,
  view_count: 5,
  trigger_count: 18,
  function_count: 4,
  trigger_function_count: 5,
  foreign_key_count: 17,
  index_count: 55,
  total_records: 1542,
  features: [
    'Relational 3NF Database Design with 16 Core Tables',
    'Row-Level Locking (SELECT ... FOR UPDATE)',
  ],
  architecture: {
    client_layer: 'React 19 + TypeScript',
    api_layer: 'FastAPI REST API',
    orm_layer: 'SQLAlchemy',
    dbms_engine: 'PostgreSQL 18.6',
    features: ['Tables', 'Views', 'Triggers'],
  },
};

const mockTables = [
  {
    name: 'users',
    description: 'User identity and accounts across all roles.',
    row_count: 25,
    column_count: 7,
    primary_key: 'id',
    foreign_key_count: 0,
    index_count: 4,
    category: 'Core Identity',
  },
  {
    name: 'events',
    description: 'Scheduled events managed by organizers.',
    row_count: 15,
    column_count: 12,
    primary_key: 'id',
    foreign_key_count: 2,
    index_count: 5,
    category: 'Events & Ticketing',
  },
  {
    name: 'bookings',
    description: 'Customer reservations.',
    row_count: 80,
    column_count: 9,
    primary_key: 'id',
    foreign_key_count: 2,
    index_count: 4,
    category: 'Bookings & Payments',
  },
];

const mockTableDetail = {
  name: 'users',
  description: 'User identity and accounts across all roles.',
  row_count: 25,
  primary_key: 'id',
  columns: [
    {
      name: 'id',
      data_type: 'bigint',
      is_nullable: false,
      column_default: null,
      is_primary_key: true,
      is_foreign_key: false,
      foreign_key_target: null,
      check_constraint: null,
    },
    {
      name: 'email',
      data_type: 'varchar',
      is_nullable: false,
      column_default: null,
      is_primary_key: false,
      is_foreign_key: false,
      foreign_key_target: null,
      check_constraint: null,
    },
  ],
  indexes: [],
  foreign_keys: [],
  triggers: [],
  check_constraints: [],
  sample_rows: [{ id: 1, email: 'admin@eventhub.com' }],
};

const mockRelationships = {
  tables: mockTables,
  relationships: [
    {
      from_table: 'bookings',
      from_column: 'user_id',
      to_table: 'users',
      to_column: 'id',
      constraint_name: 'fk_bookings_user',
      cardinality: 'many-to-one',
    },
    {
      from_table: 'events',
      from_column: 'organizer_id',
      to_table: 'organizers',
      to_column: 'id',
      constraint_name: 'fk_events_organizer',
      cardinality: 'many-to-one',
    },
  ],
};

const mockStatistics = {
  engine_version: 'PostgreSQL 18.6',
  database_size_bytes: 16777216,
  database_size_pretty: '16 MB',
  table_sizes: [
    { table: 'bookings', row_count: 80, size_pretty: '128 kB', size_bytes: 131072 },
  ],
  largest_tables_by_rows: [
    { table: 'bookings', row_count: 80, size_pretty: '128 kB', size_bytes: 131072 },
  ],
  total_records: 1542,
  summary_counts: { tables: 16, views: 5, triggers: 18 },
};

const mockViews = [
  {
    name: 'v_event_sales_summary',
    description: 'Aggregated ticket sales per event.',
    purpose: 'Provides organizers with real-time financial totals.',
    underlying_tables: ['events', 'bookings'],
    columns: ['event_id', 'event_title', 'gross_revenue'],
    definition_sql: 'CREATE OR REPLACE VIEW v_event_sales_summary AS SELECT ...',
    sample_data: [{ event_id: 1, event_title: 'Global Tech Summit', gross_revenue: 45000.0 }],
  },
];

const mockFunctions = [
  {
    name: 'calculate_booking_total',
    return_type: 'NUMERIC(12, 2)',
    arguments: 'p_booking_id BIGINT',
    category: 'BUSINESS_LOGIC' as const,
    description: 'Recalculates booking total.',
    definition_sql: 'CREATE OR REPLACE FUNCTION calculate_booking_total ...',
    example_usage: 'SELECT calculate_booking_total(1);',
  },
];

const mockTriggers = [
  {
    name: 'audit_booking_change',
    table: 'bookings',
    event: 'UPDATE',
    timing: 'AFTER',
    trigger_function: 'audit_booking_change()',
    purpose: 'Captures mutations into audit_logs.',
  },
];

const mockQueries = [
  {
    key: 'basic_join',
    title: 'Basic 2-Table JOIN',
    category: 'JOIN Operations',
    concept: 'Relational projection combining tickets and ticket_types',
    purpose: 'Retrieves ticket code and tier price.',
    sql: 'SELECT t.ticket_code, tt.price FROM tickets t JOIN ticket_types tt ON t.ticket_type_id = tt.id LIMIT 5;',
  },
];

const mockExports = [
  {
    filename: 'eventhub_demo.sql',
    title: 'PostgreSQL Demo Database Dump',
    description: 'Full dump of all 16 tables.',
    file_size_bytes: 281000,
    file_size_formatted: '274.5 KB',
    format: 'SQL Dump (.sql)',
    download_url: '/api/v1/database/exports/download/eventhub_demo.sql',
  },
];

describe('DatabasePortalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(databaseApi.getOverview).mockResolvedValue(mockOverview);
    vi.mocked(databaseApi.getTables).mockResolvedValue(mockTables);
    vi.mocked(databaseApi.getTableDetail).mockResolvedValue(mockTableDetail);
    vi.mocked(databaseApi.getRelationships).mockResolvedValue(mockRelationships);
    vi.mocked(databaseApi.getStatistics).mockResolvedValue(mockStatistics);
    vi.mocked(databaseApi.getViews).mockResolvedValue(mockViews);
    vi.mocked(databaseApi.getFunctions).mockResolvedValue(mockFunctions);
    vi.mocked(databaseApi.getTriggers).mockResolvedValue(mockTriggers);
    vi.mocked(databaseApi.getIndexes).mockResolvedValue([]);
    vi.mocked(databaseApi.getQueries).mockResolvedValue(mockQueries);
    vi.mocked(databaseApi.getExports).mockResolvedValue(mockExports);
  });

  it('1. loads and renders the Database Portal hero with PostgreSQL version', async () => {
    render(
      <MemoryRouter initialEntries={['/database']}>
        <DatabasePortalPage />
      </MemoryRouter>
    );

    expect((await screen.findAllByText(/EVENTHUB/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/DATABASE PORTAL/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/PostgreSQL 18.6/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Read-Only Safe Mode/i)).length).toBeGreaterThan(0);
  });

  it('2. renders overview metric cards (tables, views, triggers, records)', async () => {
    render(
      <MemoryRouter initialEntries={['/database']}>
        <DatabasePortalPage />
      </MemoryRouter>
    );

    expect((await screen.findAllByText(/Relational Tables/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Analytical Views/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Active Triggers/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Concurrency Control/i)).length).toBeGreaterThan(0);
  });

  it('3. navigates to tables tab and renders table cards', async () => {
    render(
      <MemoryRouter initialEntries={['/database']}>
        <DatabasePortalPage />
      </MemoryRouter>
    );

    const tablesTab = await screen.findByRole('button', { name: /^Tables/i });
    fireEvent.click(tablesTab);

    expect((await screen.findAllByText(/Core Database Tables/i)).length).toBeGreaterThan(0);
    const usersCards = await screen.findAllByText('users');
    expect(usersCards.length).toBeGreaterThan(0);
    const eventsCards = await screen.findAllByText('events');
    expect(eventsCards.length).toBeGreaterThan(0);
  });

  it('4. navigates to views tab and renders analytical view definitions', async () => {
    render(
      <MemoryRouter initialEntries={['/database']}>
        <DatabasePortalPage />
      </MemoryRouter>
    );

    const viewsTab = await screen.findByRole('button', { name: /^Views/i });
    fireEvent.click(viewsTab);

    expect((await screen.findAllByText(/Analytical PostgreSQL Views/i)).length).toBeGreaterThan(0);
    const viewHeaders = await screen.findAllByText('v_event_sales_summary');
    expect(viewHeaders.length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Aggregated ticket sales per event/i)).length).toBeGreaterThan(0);
  });

  it('5. navigates to stored functions and procedures tab', async () => {
    render(
      <MemoryRouter initialEntries={['/database']}>
        <DatabasePortalPage />
      </MemoryRouter>
    );

    const funcsTab = await screen.findByRole('button', { name: /^Functions/i });
    fireEvent.click(funcsTab);

    expect(await screen.findByText(/Stored Procedures & Trigger Functions/i)).toBeInTheDocument();
    const fnHeaders = await screen.findAllByText(/calculate_booking_total/i);
    expect(fnHeaders.length).toBeGreaterThan(0);
  });

  it('6. navigates to triggers tab and lists active database triggers', async () => {
    render(
      <MemoryRouter initialEntries={['/database']}>
        <DatabasePortalPage />
      </MemoryRouter>
    );

    const triggersTab = await screen.findByRole('button', { name: /^Triggers/i });
    fireEvent.click(triggersTab);

    expect(await screen.findByText(/Active Database Triggers/i)).toBeInTheDocument();
    expect(await screen.findByText('audit_booking_change')).toBeInTheDocument();
  });

  it('7. renders query showcase cards with copy SQL and run button', async () => {
    vi.mocked(databaseApi.executeQuery).mockResolvedValue({
      key: 'basic_join',
      title: 'Basic 2-Table JOIN',
      category: 'JOIN Operations',
      concept: 'Relational projection',
      purpose: 'Retrieves ticket code and tier price.',
      sql: 'SELECT ...',
      columns: ['ticket_code', 'price'],
      sample_rows: [{ ticket_code: 'TCK-001', price: 1500.0 }],
      execution_time_ms: 1.45,
    });

    render(
      <MemoryRouter initialEntries={['/database']}>
        <DatabasePortalPage />
      </MemoryRouter>
    );

    const queriesTab = await screen.findByRole('button', { name: /^Query Showcase/i });
    fireEvent.click(queriesTab);

    expect(await screen.findByText(/DBMS Query Showcase/i)).toBeInTheDocument();
    expect(await screen.findByText('Basic 2-Table JOIN')).toBeInTheDocument();

    const runBtn = await screen.findByRole('button', { name: /Run Predefined Query/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(databaseApi.executeQuery).toHaveBeenCalledWith('basic_join');
    });
    expect(await screen.findByText(/1.45 ms/i)).toBeInTheDocument();
    expect(await screen.findByText('TCK-001')).toBeInTheDocument();
  });

  it('8. renders verified data export download cards', async () => {
    render(
      <MemoryRouter initialEntries={['/database']}>
        <DatabasePortalPage />
      </MemoryRouter>
    );

    const exportsTab = await screen.findByRole('button', { name: /^Exports/i });
    fireEvent.click(exportsTab);

    expect(await screen.findByText(/Database Exports & Data Artifacts/i)).toBeInTheDocument();
    expect(await screen.findByText('PostgreSQL Demo Database Dump')).toBeInTheDocument();
    expect(await screen.findByText(/274.5 KB/i)).toBeInTheDocument();
  });

  it('9. strictly forbids arbitrary SQL input elements (Security Rule)', async () => {
    render(
      <MemoryRouter initialEntries={['/database']}>
        <DatabasePortalPage />
      </MemoryRouter>
    );

    expect((await screen.findAllByText(/EVENTHUB/i)).length).toBeGreaterThan(0);

    // Verify there is NO editable SQL console textarea or arbitrary execute button
    const textareas = screen.queryAllByRole('textbox');
    textareas.forEach((t) => {
      expect(t).not.toHaveAttribute('name', 'sql');
      expect(t).not.toHaveAttribute('placeholder', expect.stringMatching(/enter sql|run query/i));
    });

    expect(screen.queryByText(/execute arbitrary sql/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sql console/i)).not.toBeInTheDocument();
  });
});
