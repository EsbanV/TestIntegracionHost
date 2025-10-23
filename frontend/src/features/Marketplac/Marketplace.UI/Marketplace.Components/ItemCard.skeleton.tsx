export default function ItemCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="relative aspect-video w-full bg-gray-300" />
      <div className="p-4 md:p-5">
        <div className="flex items-center mb-3 md:mb-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 mr-3" />
          <div className="flex-1">
            <div className="h-3 md:h-4 bg-gray-300 rounded w-24 mb-1" />
            <div className="h-2 md:h-3 bg-gray-300 rounded w-16" />
          </div>
        </div>
        <div className="h-4 md:h-5 bg-gray-300 rounded w-full mb-2" />
        <div className="h-4 md:h-5 bg-gray-300 rounded w-3/4 mb-3" />
        <div className="h-3 md:h-4 bg-gray-300 rounded w-full mb-2" />
        <div className="h-3 md:h-4 bg-gray-300 rounded w-5/6 mb-2" />
        <div className="h-3 md:h-4 bg-gray-300 rounded w-2/3 mb-4" />
        <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100">
          <div className="h-3 md:h-4 bg-gray-300 rounded w-24" />
          <div className="h-3 md:h-4 bg-gray-300 rounded w-16" />
        </div>
      </div>
    </div>
  );
}
