const BUCKET_FILLS = ["bg-bucket-1", "bg-bucket-2", "bg-bucket-3", "bg-bucket-4", "bg-bucket-5", "bg-bucket-6", "bg-bucket-7", "bg-bucket-8"] as const

/** A stable colour for the nth item of a list, from the template's bucket palette. */
export const fillAt = (index: number) => BUCKET_FILLS[index % BUCKET_FILLS.length]
