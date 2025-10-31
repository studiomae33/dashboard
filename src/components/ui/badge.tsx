import { cn, getDisplayStatus } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border-transparent bg-blue-600 text-white': variant === 'default',
          'border-transparent bg-gray-100 text-gray-900': variant === 'secondary',
          'border-transparent bg-red-600 text-white': variant === 'destructive',
          'text-gray-950': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  )
}

interface StatusBadgeProps {
  status: string
  quote?: {
    status: string
    desiredEnd: string | Date
  }
}

function StatusBadge({ status, quote }: StatusBadgeProps) {
  // Utiliser le statut d'affichage si on a les détails du devis
  const displayStatus = quote ? getDisplayStatus(quote) : status
  
  const config = {
    DRAFT: { label: 'Brouillon', variant: 'secondary' as const },
    READY: { label: 'Prêt', variant: 'outline' as const },
    SENT: { label: 'Envoyé', variant: 'outline' as const },
    SIGNED: { label: 'Signé', variant: 'secondary' as const },
    PAYMENT_PENDING: { label: 'Paiement demandé', variant: 'secondary' as const },
    ONSITE_PAYMENT: { label: 'Paiement sur place', variant: 'default' as const },
    PAID: { label: 'Réglé', variant: 'secondary' as const },
    NEEDS_INVOICE: { label: 'Facture à envoyer', variant: 'destructive' as const },
    INVOICED: { label: 'Facturé', variant: 'secondary' as const },
  }

  const { label, variant } = config[displayStatus as keyof typeof config] || { label: displayStatus, variant: 'secondary' as const }

  return <Badge variant={variant}>{label}</Badge>
}

export { Badge, StatusBadge }
