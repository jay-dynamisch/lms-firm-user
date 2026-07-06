import { Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Certificates() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          My Certificates
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          View and download your earned credentials.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 border-dashed"
      >
        <div className="bg-gray-50 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          No certificates yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
          Complete assigned courses to earn certificates and build your
          learning portfolio.
        </p>
      </motion.div>
    </div>
  );
}