// Pi Network SDK 타입 선언
interface PiUser {
  uid: string
  username: string
}

interface PiPaymentData {
  amount: number
  memo: string
  metadata: Record<string, unknown>
}

interface PiPayment {
  identifier: string
  user_uid: string
  amount: number
  memo: string
  metadata: Record<string, unknown>
  status: {
    developer_approved: boolean
    transaction_verified: boolean
    developer_completed: boolean
    cancelled: boolean
    user_cancelled: boolean
  }
  transaction: null | {
    txid: string
    verified: boolean
    _link: string
  }
}

interface PiAuthResult {
  accessToken: string
  user: PiUser
}

interface PiSDK {
  init(config: { version: string; sandbox?: boolean }): void
  authenticate(
    scopes: string[],
    onIncompletePaymentFound: (payment: PiPayment) => void
  ): Promise<PiAuthResult>
  createPayment(
    paymentData: PiPaymentData,
    callbacks: {
      onReadyForServerApproval: (paymentId: string) => void
      onReadyForServerCompletion: (paymentId: string, txid: string) => void
      onCancel: (paymentId: string) => void
      onError: (error: Error, payment?: PiPayment) => void
    }
  ): void
  openShareDialog(title: string, message: string): void
}

declare global {
  interface Window {
    Pi: PiSDK
  }
}

export {}
