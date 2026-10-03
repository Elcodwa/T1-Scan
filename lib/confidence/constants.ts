/**
 * All tunable numbers live here, with the reasoning. Nothing in the engine may
 * embed an unexplained literal; if a threshold changes, it changes in one place.
 */
export const CONFIDENCE = {
  /** MediaPipe face mesh exposes no per-landmark confidence, so we start from a fixed prior and only reduce it. */
  MEDIAPIPE_LANDMARK_PRIOR: 0.95,
  /** Landmarks closer than this fraction of the image size to an edge are treated as probably clipped. */
  EDGE_MARGIN_FRACTION: 0.02,
  /** Landmark outside the frame (really clipped). */
  EDGE_CONFIDENCE: 0.15,
  /** Landmark just inside the margin: confidence rises linearly from EDGE_CONFIDENCE (at the border) to this value (at the margin). */
  EDGE_NEAR_CONFIDENCE: 0.8,
  /** Far-side landmarks lose confidence as |yaw| grows beyond FAR_SIDE_START_DEG, reaching the floor at FAR_SIDE_FULL_DEG. */
  FAR_SIDE_START_DEG: 20,
  FAR_SIDE_FULL_DEG: 90,
  FAR_SIDE_FLOOR: 0.2,

  /** Status thresholds on final metric confidence. */
  STATUS_RELIABLE: 0.75,
  STATUS_USABLE: 0.5,
  /** Below STATUS_USABLE a value is still shown, labelled approximate. Only below this floor is it withheld. */
  STATUS_LOW: 0.12,
  /**
   * Factors are combined as a weighted geometric mean (product of factor^weight). Image quality and perspective are
   * soft, correlated signals (a small, compressed face triggers several of them at once), so they count for less than
   * landmark validity, pose and stability, which directly bound how wrong the number can be.
   */
  FACTOR_WEIGHT: { landmarks: 1, imageQuality: 0.45, pose: 0.8, expression: 1, perspective: 0.6, stability: 0.8 },

  /** Pose classification boundaries (|yaw| degrees). */
  POSE_FRONTAL_MAX: 8,
  POSE_SLIGHT_MAX: 25,
  POSE_THREE_QUARTER_MAX: 55,
  /** Profile metrics use 3D angles between midline landmarks, so they need the head turned enough that depth is well-conditioned. */
  PROFILE_MIN_YAW: 35,
  PROFILE_FULL_YAW: 65,
  PROFILE_YAW_FLOOR: 0.55,
  /** Landmarks derived from other landmarks (e.g. pogonion) are less trusted than directly detected ones. */
  DERIVED_LANDMARK_FACTOR: 0.85,
  /** Typical face-box height/width for a frontal face; converts a (narrow) profile box into an equivalent face width. */
  FACE_BOX_ASPECT: 1.4,
  /** Beyond this |yaw| the bilateral head frame is not trustworthy. */
  FRAME_VALID_MAX_YAW: 60,

  /** Residual pose penalty after 3D frontalisation: factor = 1 - sensitivity * min(1, (|angle|/FULL)^2). */
  POSE_RESIDUAL_FULL_YAW_DEG: 60, // equals FRAME_VALID_MAX_YAW: the residual penalty and frame validity share one limit
  POSE_RESIDUAL_FULL_PITCH_DEG: 35,
  POSE_RESIDUAL_FULL_ROLL_DEG: 90,

  /** Landmark jitter model (px): sigma = sqrt((faceWidthPx * FRACTION * (1 + BLUR_GAIN * blur))^2 + FLOOR^2). The model's error is roughly a fixed fraction of face size; the quantisation floor dominates for tiny faces. */
  JITTER_MIN_PX: 0.5,
  JITTER_FACE_FRACTION: 0.004,
  JITTER_BLUR_GAIN: 2,
  UNCERTAINTY_SAMPLES: 96,
  UNCERTAINTY_SEED: 0x71a5c4,
  /** Relative std (std/|value|) at which the stability factor reaches zero. */
  MAX_RELATIVE_UNCERTAINTY: 0.3,
  /** A noisy value is still reported (with its ± shown); stability only pulls confidence down to this floor instead of deleting the result. */
  STABILITY_FLOOR: 0.25,

  /** Face size (px) below which landmark precision is physically limited. */
  FACE_PX_FULL_QUALITY: 220,
  FACE_PX_MIN: 60,

  /** Perspective: assumed horizontal FOV when EXIF focal length is missing; real bizygomatic width for distance estimation. */
  ASSUMED_HFOV_DEG: 70,
  REFERENCE_FACE_WIDTH_CM: 14,
  REFERENCE_FACE_DEPTH_CM: 10,
  /** severity = depth / distance; at this value perspective confidence reaches its floor. */
  PERSPECTIVE_FULL_SEVERITY: 0.45,
  PERSPECTIVE_FLOOR: 0.4,
  /** Without EXIF a tight crop is indistinguishable from a close-up, so an assumed-FOV severity is capped. */
  PERSPECTIVE_ASSUMED_CAP: 0.3,

  /** Expression thresholds (fractions of face height / width). */
  MOUTH_OPEN_THRESHOLD: 0.045,
  SMILE_THRESHOLD: 0.03,
  EXPRESSION_PENALTY: 0.35,

  /** Consensus between geometry sources: agreement within 1x tolerance -> bonus, beyond 3x -> penalty. */
  CONSENSUS_BONUS: 0.06,
  CONSENSUS_MAX_PENALTY: 0.5,

  /** Harmony score: minimum share of total weight that must be available. */
  HARMONY_MIN_WEIGHT_COVERAGE: 0.6,
  HARMONY_MIN_METRIC_CONFIDENCE: 0.3,
} as const;

export const ENGINE_VERSION = "2.1.0";

/** Extra tunables (kept separate so the block above stays a stable reference). */
export const CONFIDENCE_EXTRA = {
  /** MediaPipe z is noisier than x/y; z jitter is this multiple of the xy jitter in uncertainty sampling. */
  JITTER_Z_MULTIPLIER: 2.5,
  /** quality factor = FLOOR + (1-FLOOR) * forensics.overall */
  QUALITY_FLOOR: 0.55,
} as const;

export const SCORING = {
  /** Share of a dimension's total weight that must be measured for a "complete" score. */
  COMPLETE_COVERAGE: 0.8,
  /** Between PARTIAL and COMPLETE the score is shown but labelled partial; below PARTIAL it is withheld. */
  PARTIAL_COVERAGE: 0.4,
  /** Metrics below this confidence do not contribute at all. */
  MIN_METRIC_CONFIDENCE: 0.2,
  MAX_SCORE: 10,
} as const;
