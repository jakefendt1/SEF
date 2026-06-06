import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { StoredAssessment } from '../lib/db'
import type { FormValues } from '../schema/formSchema'

const styles = StyleSheet.create({
  page: { fontSize: 9, fontFamily: 'Helvetica', padding: 36, color: '#1a1a1a' },
  header: { marginBottom: 16 },
  appTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1e3a5f' },
  subtitle: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  meta: { fontSize: 8, color: '#9ca3af', marginTop: 4 },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e3a5f',
    borderBottomWidth: 1, borderBottomColor: '#dbeafe', paddingBottom: 3, marginBottom: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  field: { width: '50%', marginBottom: 5, paddingRight: 8 },
  fieldFull: { width: '100%', marginBottom: 5 },
  label: { fontSize: 7.5, color: '#6b7280', fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  value: { fontSize: 9 },
  modeBadge: {
    alignSelf: 'flex-start', fontSize: 8, fontFamily: 'Helvetica-Bold',
    backgroundColor: '#1e3a5f', color: '#ffffff', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, marginBottom: 10,
  },
})

function Field({
  label,
  value,
  full,
}: {
  label: string
  value: string | number | undefined
  full?: boolean
}) {
  if (!value && value !== 0) return null
  return (
    <View style={full ? styles.fieldFull : styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>{children}</View>
    </View>
  )
}

function fmt(v: unknown): string {
  if (v == null) return ''
  if (Array.isArray(v)) return v.join(', ')
  return String(v)
}

export function AssessmentPDF({ assessment }: { assessment: StoredAssessment }) {
  const d = assessment.data as Partial<FormValues>
  const date = new Date(assessment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const syncDate = assessment.syncedAt
    ? new Date(assessment.syncedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null

  return (
    <Document title="Spiral Evaluation" author="Intralox Spiral Eval">
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Spiral Evaluation</Text>
          <Text style={styles.subtitle}>Intralox Field Assessment</Text>
          <Text style={styles.meta}>
            {date} · Assessment ID: {assessment.id}
            {syncDate ? ` · Synced: ${syncDate}` : ''}
          </Text>
        </View>

        <Text style={styles.modeBadge}>
          {d.mode === 'full' ? 'Full Mode' : 'Quick Mode'}
        </Text>

        {/* § 1 Personal Info */}
        <Section title="Personal Info">
          <Field label="Name" value={d.name} />
          <Field label="Company" value={d.companyName} />
          <Field label="Email" value={d.email} />
          <Field label="Phone" value={d.phone} />
          <Field label="Title" value={d.title} />
          <Field label="Country / Region" value={d.countryOrRegion} />
          <Field label="Address" value={d.address} full />
          <Field label="City" value={d.city} />
          <Field label="State / Province" value={d.stateProvince} />
          <Field label="Zip / Postal Code" value={d.zipPostalCode} />
        </Section>

        {/* § 2 Application */}
        <Section title="Application">
          <Field label="Installation Type" value={d.installationType} />
          <Field label="Application Type" value={d.applicationType === 'Other' ? fmt(d.applicationTypeOther) : d.applicationType} />
          <Field label="Product Processed" value={d.productProcessed} full />
          <Field label="How Product Carried" value={d.howProductCarried} />
          <Field label="Heat Source" value={fmt(d.heatSource)} />
          <Field label="Product Properties" value={fmt(d.productProperties)} />
          <Field label="Belt Cleaning" value={d.beltCleaning} />
          <Field label="Chemicals Used" value={d.chemicalsUsed} />
          <Field label="Product Load" value={d.productLoad != null ? `${d.productLoad} ${d.productLoadUnit ?? ''}` : undefined} />
          <Field label="Weight / Piece" value={d.weightPerPiece != null ? `${d.weightPerPiece} ${d.weightPerPieceUnit ?? ''}` : undefined} />
          <Field label="Product Dimensions (L×W×H)" value={
            d.productDimL != null ? `${d.productDimL}" × ${d.productDimW}" × ${d.productDimH}"` : undefined
          } />
          <Field label="Production Rate" value={d.productionRate != null ? `${d.productionRate} ${d.productionRateUnit ?? ''}` : undefined} />
          <Field label="Production Hrs/Day" value={d.productionHoursPerDay} />
          <Field label="Loading Pattern" value={d.loadingPattern} />
          <Field label="Products Across Width" value={d.productsAcrossWidth} />
          <Field label="Leading Dimension" value={d.leadingDimension} />
          <Field label="Incoming Temp" value={d.incomingProductTemp != null ? `${d.incomingProductTemp}°F` : undefined} />
          <Field label="Env Temp" value={d.operatingEnvTemp != null ? `${d.operatingEnvTemp}°F` : undefined} />
          <Field label="Env Temp Range" value={
            d.minOperatingEnvTemp != null ? `${d.minOperatingEnvTemp}°F – ${d.maxOperatingEnvTemp}°F` : undefined
          } />
          <Field label="Belt Speed" value={d.beltSpeed != null ? `${d.beltSpeed} fpm` : undefined} />
          <Field label="Belt Type" value={d.beltType} />
          <Field label="Technology" value={d.technology} />
          <Field label="Belt Series" value={d.preferredBeltSeries === 'Other' ? fmt(d.preferredBeltSeriesOther) : d.preferredBeltSeries} />
          <Field label="Belt Accessories" value={fmt(d.beltAccessories)} />
          <Field label="Sprocket Bore" value={d.sprocketBoreSize != null ? `${d.sprocketBoreSize}"` : undefined} />
          <Field label="Comments" value={d.additionalComments} full />
        </Section>

        {/* § 3 System Information */}
        <Section title="System Information">
          <Field label="Manufacturer" value={d.spiralManufacturer} />
          <Field label="Travel Direction" value={d.travelDirection} />
          <Field label="Rotation Direction" value={d.rotationDirection} />
          <Field label="Tiers (Spiral 1)" value={d.numTiersSpiral1} />
          <Field label="Tiers (Spiral 2)" value={d.numTiersSpiral2} />
          <Field label="Tier Pitch" value={d.tierPitch != null ? `${d.tierPitch}"` : undefined} />
          <Field label="Take Up Travel" value={d.takeUpTravelLength != null ? `${d.takeUpTravelLength}"` : undefined} />
          <Field label="Take Up Loop" value={d.takeUpLoop} />
          <Field label="Belt Length" value={d.beltLength != null ? `${d.beltLength} ft` : undefined} />
          <Field label="Min Roller Dia" value={d.minRollerDiameter != null ? `${d.minRollerDiameter}"` : undefined} />
          <Field label="Drum Basis" value={d.drumBasis} />
          <Field label="Drum Value" value={d.drumValue != null ? `${d.drumValue}"` : undefined} />
          <Field label="Belt Width" value={d.beltWidth != null ? `${d.beltWidth}"` : undefined} />
          <Field label="Infeed Length (A)" value={d.infeedLength != null ? `${d.infeedLength} ft` : undefined} />
          <Field label="Discharge Length (B)" value={d.dischargeLength != null ? `${d.dischargeLength} ft` : undefined} />
          <Field label="Distance Between Drums" value={d.distanceBetweenDrums != null ? `${d.distanceBetweenDrums} ft` : undefined} />
          <Field label="Config (Spiral 1)" value={d.configurationSpiral1} />
          <Field label="Config (Spiral 2)" value={d.configurationSpiral2} />
          <Field label="Return Type (Spiral 1)" value={d.returnTypeSpiral1} />
          <Field label="Return Type (Spiral 2)" value={d.returnTypeSpiral2} />
        </Section>

        {/* § 4 System Details */}
        <Section title="System Details">
          <Field label="Num Rails" value={d.numRails} />
          <Field label="Rail Spacing" value={d.railSpacing != null ? `${d.railSpacing}"` : undefined} />
          <Field label="Overhang" value={d.overhang != null ? `${d.overhang}"` : undefined} />
          <Field label="Belt Support Material" value={d.beltSupportMaterial} />
          <Field label="Carryway Wearstrip" value={d.carrywayWearstripMaterial === 'Other' ? fmt(d.carrywayWearstripMaterialOther) : d.carrywayWearstripMaterial} />
          <Field label="Drum Type" value={d.drumType} />
          <Field label="Cage Bar Dims (A/B/C)" value={
            d.cageBarDimA != null ? `${d.cageBarDimA}" / ${d.cageBarDimB}" / ${d.cageBarDimC}"` : undefined
          } />
          <Field label="Cap Material" value={d.cageBarCapMaterial === 'Other' ? fmt(d.cageBarCapMaterialOther) : d.cageBarCapMaterial} />
          <Field label="Cap Profile" value={d.capProfile === 'Other' ? fmt(d.capProfileOther) : d.capProfile} />
          <Field label="Tier Sensors/Tier" value={d.tierSensorsEveryTier} />
          <Field label="Take Up Sensors" value={fmt(d.takeUpSensors)} />
          <Field label="Belt Washer" value={d.beltWasher} />
          <Field label="Top Tier Hold Down" value={d.topTierHoldDown} />
          <Field label="Return Path Hold Down" value={d.returnPathHoldDown} />
          <Field label="Product Containment Rail" value={d.productContainmentRail} />
          <Field label="Num VFDs" value={d.numVFDs} />
        </Section>

        {/* § 5 Project Information */}
        {(d.projectNumber || d.endUserName || d.endUserCity || d.lineId) && (
          <Section title="Project Information">
            <Field label="Project #" value={d.projectNumber} />
            <Field label="End User Name" value={d.endUserName} />
            <Field label="End User City" value={d.endUserCity} />
            <Field label="End User State" value={d.endUserState} />
            <Field label="Line ID" value={d.lineId} />
          </Section>
        )}
      </Page>
    </Document>
  )
}
