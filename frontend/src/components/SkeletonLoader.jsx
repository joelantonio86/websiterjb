const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const skeletons = Array.from({ length: count })

  if (type === 'card') {
    return (
      <>
        {skeletons.map((_, index) => (
          <div
            key={index}
            className="animate-pulse bg-gradient-to-br from-rjb-card-light via-rjb-card-light/50 to-rjb-card-light/30 dark:from-rjb-card-dark dark:via-rjb-card-dark/50 dark:to-rjb-card-dark/30 rounded-2xl p-6 shadow-lg"
          >
            <div className="h-12 w-12 rounded-xl bg-rjb-yellow/20 dark:bg-rjb-yellow/10 mb-4"></div>
            <div className="h-6 bg-rjb-text/20 dark:bg-rjb-text-dark/20 rounded-lg mb-3 w-3/4"></div>
            <div className="h-4 bg-rjb-text/10 dark:bg-rjb-text-dark/10 rounded-lg w-full mb-2"></div>
            <div className="h-4 bg-rjb-text/10 dark:bg-rjb-text-dark/10 rounded-lg w-5/6"></div>
          </div>
        ))}
      </>
    )
  }

  if (type === 'list') {
    return (
      <>
        {skeletons.map((_, index) => (
          <div
            key={index}
            className="animate-pulse flex items-center gap-4 p-4 bg-gradient-to-br from-rjb-card-light via-rjb-card-light/50 to-rjb-card-light/30 dark:from-rjb-card-dark dark:via-rjb-card-dark/50 dark:to-rjb-card-dark/30 rounded-xl mb-3"
          >
            <div className="h-12 w-12 rounded-full bg-rjb-yellow/20 dark:bg-rjb-yellow/10 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-5 bg-rjb-text/20 dark:bg-rjb-text-dark/20 rounded-lg mb-2 w-2/3"></div>
              <div className="h-4 bg-rjb-text/10 dark:bg-rjb-text-dark/10 rounded-lg w-1/2"></div>
            </div>
          </div>
        ))}
      </>
    )
  }

  if (type === 'text') {
    return (
      <>
        {skeletons.map((_, index) => (
          <div key={index} className="animate-pulse mb-4">
            <div className="h-4 bg-rjb-text/20 dark:bg-rjb-text-dark/20 rounded-lg mb-2 w-full"></div>
            <div className="h-4 bg-rjb-text/10 dark:bg-rjb-text-dark/10 rounded-lg mb-2 w-5/6"></div>
            <div className="h-4 bg-rjb-text/10 dark:bg-rjb-text-dark/10 rounded-lg w-4/6"></div>
          </div>
        ))}
      </>
    )
  }

  return null
}

export default SkeletonLoader
