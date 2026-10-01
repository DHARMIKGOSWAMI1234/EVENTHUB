// frontend/src/tests/Dashboards.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatCard, SimpleBarChart } from '../components/analytics/AnalyticsCharts'
import { Users } from 'lucide-react'

describe('Analytics & Dashboards', () => {
  it('renders StatCard with title, value, and subtitle', () => {
    render(
      <StatCard
        title="Total Revenue"
        value="₹1,25,000"
        subtitle="Gross platform collections"
        icon={Users}
        color="indigo"
      />
    )

    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('₹1,25,000')).toBeInTheDocument()
    expect(screen.getByText('Gross platform collections')).toBeInTheDocument()
  })

  it('renders SimpleBarChart with bar items', () => {
    const data = [
      { label: 'Jan', value: 1000 },
      { label: 'Feb', value: 2500 },
    ]

    render(<SimpleBarChart data={data} isCurrency height={180} />)

    expect(screen.getByText('Jan')).toBeInTheDocument()
    expect(screen.getByText('Feb')).toBeInTheDocument()
  })
})
