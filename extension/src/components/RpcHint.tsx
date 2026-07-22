const φ = Math.PHI

// Text-only guidance (no modal system in the extension, unlike web's
// RpcDoctorModal/OptionsModal buttons) pointing a stuck/errored user at the
// Settings tab, where the block range can be lowered or the RPC doctor run.
export const RpcHint = () => (
  <p style={{ color: '#f0c040', fontSize: `${1 / φ}em`, margin: 0 }}>
    Your RPC may be rejecting large log ranges — try lowering the block range (or running the RPC
    doctor) in Settings.
  </p>
)
