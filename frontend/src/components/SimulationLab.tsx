import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Customer } from '../types';
import { resetDemoData, fetchProducts, fetchCustomers } from '../services/api';
import { SimulationLabHeader } from './simulation/SimulationLabHeader';
import { OrderSimulator } from './simulation/OrderSimulator';
import { MessageSimulator } from './simulation/MessageSimulator';
import { SimulationLogViewer } from './simulation/SimulationLogViewer';
import { ResetConfirmModal } from './simulation/ResetConfirmModal';

interface SimulationLabProps {
  onRefreshAll?: () => void;
  isAutoSimulating: boolean;
  onToggleAutoSim: () => void;
  autoSimLogs: any[];
  onClearLogs: () => void;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({
  onRefreshAll,
  isAutoSimulating,
  onToggleAutoSim,
  autoSimLogs,
  onClearLogs,
}) => {
  // Catalogs & Customers
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Reset Demo State
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Flat list of SKU variants for easy selection
  const allVariants = useMemo(() => {
    const list: {
      sku: string;
      productName: string;
      color: string;
      size: string;
      price: number;
      stocks: { [platform: string]: number };
    }[] = [];

    products.forEach((p) => {
      p.variants.forEach((v) => {
        const stocksMap: { [platform: string]: number } = {};
        v.channels.forEach((ch) => {
          stocksMap[ch.platform] = ch.stock;
        });

        list.push({
          sku: v.sku,
          productName: p.name,
          color: v.color,
          size: v.size,
          price: v.price,
          stocks: stocksMap,
        });
      });
    });
    return list;
  }, [products]);

  // Load products and customers on mount
  useEffect(() => {
    let isSubscribed = true;

    Promise.all([fetchProducts(), fetchCustomers()])
      .then(([prods, custs]) => {
        if (!isSubscribed) return;
        setProducts(prods);
        setCustomers(custs);
      })
      .catch((err) => console.error('Error loading simulation dependencies:', err));

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Reset Demo Data
  const handleConfirmReset = async () => {
    setIsResetting(true);
    setResetSuccessMessage('');
    try {
      const res = await resetDemoData();
      setShowResetConfirm(false);
      setResetSuccessMessage(res.message || 'Database berhasil di-reset ke kondisi awal!');

      // Reload products & customers
      const [prods, custs] = await Promise.all([fetchProducts(), fetchCustomers()]);
      setProducts(prods);
      setCustomers(custs);

      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert('Gagal mereset data: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 transition-colors">
      {/* 1. Header Banner & Engine Control */}
      <SimulationLabHeader
        isAutoSimulating={isAutoSimulating}
        onToggleAutoSim={onToggleAutoSim}
        onOpenResetConfirm={() => setShowResetConfirm(true)}
        resetSuccessMessage={resetSuccessMessage}
      />

      {/* 2. Dual Simulator Cards: Order Simulator & Message Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderSimulator
          allVariants={allVariants}
          customers={customers}
          onRefreshAll={onRefreshAll}
        />
        <MessageSimulator
          customers={customers}
          onRefreshAll={onRefreshAll}
        />
      </div>

      {/* 3. Live Auto Simulation Logs Stream */}
      <SimulationLogViewer
        logs={autoSimLogs}
        onClearLogs={onClearLogs}
      />

      {/* 4. Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetConfirm}
        isResetting={isResetting}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
};
