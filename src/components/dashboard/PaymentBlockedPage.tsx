"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, Phone } from "lucide-react";
import { motion } from "framer-motion";

export function PaymentBlockedPage() {
  const t = useTranslations();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center w-full h-full"
    >
      <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 max-w-md text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mb-6 flex justify-center"
        >
          <div className="bg-red-100 rounded-full p-4">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </motion.div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Paiement Requis
        </h1>

        <p className="text-gray-600 mb-2 text-lg font-medium">
          Accès Limité
        </p>

        <p className="text-gray-500 mb-8">
          Le paiement est nécessaire pour continuer à utiliser cette plateforme. Veuillez contacter le responsable pour effectuer le paiement.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
            <Phone className="w-5 h-5" />
            <span>Contactez l'administrateur</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Si vous pensez que c'est une erreur, veuillez contacter le support.
        </p>
      </div>
    </motion.div>
  );
}
