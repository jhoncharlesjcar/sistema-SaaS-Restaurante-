import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "../auth/AuthProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  FileText,
  FileCode,
  MoreHorizontal,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateInvoicePdf, type InvoiceData } from "@/utils/invoicePdf";
import { downloadInvoiceXml } from "@/utils/invoiceXml";
import { printInvoice } from "@/utils/invoicePrint";
import { SplitBillModal } from "./SplitBillModal";
import { Receipt, XCircle, Monitor, MonitorOff, Keyboard } from "lucide-react";
import { VoidInvoiceModal } from "./VoidInvoiceModal";
import { useKioskStore } from "@/stores/kioskStore";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_name?: string;
  customer_doc_type?: string;
  customer_doc_number?: string;
  customer_address?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  invoice_type: string;
  serie: string;
  correlative: number;
  metadata?: any;
  sunat_status: string;
  created_at: string;
}

export default function Invoicing() {
  const { user } = useAuth();
  const restaurantId = user?.restaurant_id;
  const queryClient = useQueryClient();
  const location = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [invoiceType, setInvoiceType] = useState<"FACTURA" | "BOLETA">(
    "BOLETA",
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("efectivo");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [customerData, setCustomerData] = useState({
    name: "",
    document: "",
    address: "",
  });

  // Kiosk Mode & Split Bill State
  const { isKioskMode, toggleKioskMode } = useKioskStore();
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [invoiceToVoid, setInvoiceToVoid] = useState<string | null>(null);
  const [splitBillDetails, setSplitBillDetails] = useState<{
    amount: number;
    details: string;
    isSplit: boolean;
  }>({ amount: 0, details: "", isSplit: false });
  useEffect(() => {
    if (location.state?.selectedOrderId) {
      console.log(
        "🔗 Order selected from location state:",
        location.state.selectedOrderId,
      );
      setSelectedOrder(location.state.selectedOrderId);
    }
  }, [location.state]);

  // Reset split bill when selecting a different order
  useEffect(() => {
    setSplitBillDetails({ amount: 0, details: "", isSplit: false });
  }, [selectedOrder]);

  // Fetch pending orders (paid but not invoiced)
  const { data: pendingOrders, isLoading } = useQuery({
    queryKey: ["pending-invoices", restaurantId],
    queryFn: async () => {
      if (!restaurantId) {
        console.log("❌ No restaurantId available");
        return [];
      }

      console.log("🔍 Fetching pending orders for restaurant:", restaurantId);

      // PASO 1: Obtener IDs de órdenes que ya tienen facturas
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("order_id")
        .eq("restaurant_id", restaurantId);

      if (invoicesError) {
        console.error("❌ Error fetching invoices:", invoicesError);
      }

      const invoicedOrderIds = new Set(
        (invoicesData || []).map((inv: any) => inv.order_id).filter(Boolean),
      );
      console.log("🧾 Orders with invoices:", invoicedOrderIds.size);

      // PASO 2: Obtener órdenes con estados pendientes
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, product:products(name))")
        .eq("restaurant_id", restaurantId)
        .in("status", ["delivered", "ready", "sent_to_kitchen"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching orders:", error);
        throw error;
      }

      console.log("📦 Total orders fetched:", data?.length || 0);

      // PASO 3: Filtrar órdenes que NO tienen facturas
      const filtered =
        data?.filter((order) => {
          const hasInvoice = invoicedOrderIds.has(order.id);
          return !hasInvoice;
        }) || [];

      console.log("✅ Pending orders after filter:", filtered.length);
      return filtered;
    },
    enabled: !!restaurantId,
    // Refetch cada 5 segundos para mantener actualizado
    refetchInterval: 5000,
  });

  // Fetch invoices (invoices)
  const { data: invoices } = useQuery({
    queryKey: ["invoices", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return data as Invoice[];
    },
    enabled: !!restaurantId,
  });

  // Derived state
  // Los datos vienen de 'comandas', mapeamos a nombres en inglés para el componente
  const selectedOrderDetails = pendingOrders?.find(
    (o: any) => o.id === selectedOrder,
  );

  // Helper para obtener nombre de mesa
  const getTableName = (order: any) => {
    return order.mesas?.nombre || order.mesas?.table_name || "General";
  };

  // Fetch invoices for the selected order to calculate balance
  const { data: existingInvoicesForOrder } = useQuery({
    queryKey: ["order-invoices", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("order_id", selectedOrder);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedOrder,
  });

  const totalPaidForOrder =
    existingInvoicesForOrder?.reduce(
      (sum, inv) => sum + Number(inv.total),
      0,
    ) || 0;
  const remainingBalance = selectedOrderDetails
    ? Number(selectedOrderDetails.total) - totalPaidForOrder
    : 0;
  const invoiceTotal = splitBillDetails.isSplit
    ? splitBillDetails.amount
    : selectedOrderDetails?.total || 0;

  const change =
    paymentMethod === "efectivo" && amountPaid && invoiceTotal
      ? Math.max(0, parseFloat(amountPaid) - invoiceTotal)
      : 0;

  const isPaymentValid =
    paymentMethod !== "efectivo" ||
    (amountPaid && parseFloat(amountPaid) >= invoiceTotal);

  // Global Keypad Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused, unless it's a specific logic
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key >= "0" && e.key <= "9") {
        setAmountPaid((prev) => prev + e.key);
      } else if (e.key === "." || e.key === ",") {
        if (!amountPaid.includes(".")) setAmountPaid((prev) => prev + ".");
      } else if (e.key === "Backspace") {
        setAmountPaid((prev) => prev.slice(0, -1));
      } else if (e.key === "Enter") {
        if (isPaymentValid && selectedOrder) {
          generateInvoice.mutate({
            orderId: selectedOrder,
            customer: customerData,
            paymentMethod,
            type: invoiceType,
            paymentDetails: { amount_paid: Number(amountPaid), change: change },
          });
        }
      } else if (e.key === "Escape") {
        setSelectedOrder(null);
        setAmountPaid("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    amountPaid,
    isPaymentValid,
    selectedOrder,
    customerData,
    paymentMethod,
    invoiceType,
    change,
  ]);

  const generateInvoice = useMutation({
    mutationFn: async ({
      orderId,
      customer,
      paymentMethod,
      type,
      paymentDetails,
    }: {
      orderId: string;
      customer: { name: string; document: string; address: string };
      paymentMethod: string;
      type: "FACTURA" | "BOLETA";
      paymentDetails?: { amount_paid: number; change: number };
    }) => {
      if (!restaurantId) throw new Error("No tenant ID");

      const serie = type === "FACTURA" ? "F001" : "B001";

      // 1. Get next sequential number via RPC (assuming it was updated to use invoices table)
      const { data: nextNum, error: rpcError } = await supabase.rpc(
        "generate_invoice_number",
        {
          p_restaurant_id: restaurantId,
          p_invoice_type: type,
          p_serie: serie,
        },
      );

      if (rpcError)
        throw new Error(`Error al obtener correlativo: ${rpcError.message}`);

      // 2. Get order details and items
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*, order_items(*, product:products(*))")
        .eq("id", orderId)
        .single();

      if (orderError || !order) throw new Error("Orden no encontrada");

      const items = order.order_items || [];

      // SUNAT Calculation Rules:
      const subtotal = Number((invoiceTotal / 1.18).toFixed(2));
      const tax_amount = Number((invoiceTotal - subtotal).toFixed(2));

      // 3. Create Invoice
      const invoicePayload = {
        restaurant_id: restaurantId,
        order_id: orderId,
        invoice_type: type,
        serie: serie,
        correlative: nextNum,
        invoice_number: `${serie}-${String(nextNum).padStart(8, "0")}`,
        customer_doc_type:
          customer.document.length === 11
            ? "6"
            : customer.document.length === 8
              ? "1"
              : "0",
        customer_doc_number: customer.document || "00000000",
        customer_name:
          customer.name ||
          (type === "BOLETA" ? "CLIENTE VARIOS" : "SIN NOMBRE"),
        customer_address: customer.address,
        subtotal: subtotal,
        tax_amount: tax_amount,
        total: invoiceTotal,
        sunat_status: "pending",
        metadata: {
          payment_method: paymentMethod,
          ...paymentDetails,
          items: items.map((it: any) => ({
            description: it.product?.name || it.product_name || "Product",
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
            subtotal: Number((it.subtotal / 1.18).toFixed(2)),
          })),
        },
      };

      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .insert([invoicePayload])
        .select()
        .single();

      if (invError) throw invError;

      // 4. Update Order Status (Check if fully paid)
      const { data: allInvoices } = await supabase
        .from("invoices")
        .select("total")
        .eq("order_id", orderId);

      const previousTotalPaid = (allInvoices || []).reduce(
        (sum, inv) => sum + Number(inv.total),
        0,
      );

      if (previousTotalPaid >= order.total - 0.01) {
        await supabase
          .from("orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", orderId);
      }

      return invoice;
    },
    onSuccess: () => {
      console.log("✅ Invoice generated successfully, invalidating queries...");
      queryClient.invalidateQueries({ queryKey: ["pending-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // Invalidar lista de órdenes también
      setSelectedOrder(null); // Limpiar selección
      setAmountPaid(""); // Limpiar monto pagado
      toast.success("Comprobante generado exitosamente");
      toast.success("Comprobante generado exitosamente");
      setSelectedOrder(null);
      setAmountPaid("");
      setCustomerData({ name: "", document: "", address: "" });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={cn("text-3xl font-bold", isKioskMode && "text-4xl")}>
              Facturación y Boletas
            </h1>
            <p className="text-gray-600">Emisión de invoices electrónicos</p>
          </div>
          <div className="flex items-center gap-2">
            {isKioskMode && (
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold animate-pulse">
                <Keyboard className="w-4 h-4" /> Teclado Activo
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleKioskMode}
              className={cn(
                isKioskMode && "bg-primary text-white hover:bg-primary/90",
              )}
            >
              {isKioskMode ? (
                <MonitorOff className="w-4 h-4 mr-2" />
              ) : (
                <Monitor className="w-4 h-4 mr-2" />
              )}
              {isKioskMode ? "Salir Modo Kiosko" : "Modo Kiosko"}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "grid gap-6",
            isKioskMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2",
          )}
        >
          {/* Pending Orders */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Órdenes Pendientes</h2>
            {isLoading ? (
              <div>Cargando...</div>
            ) : pendingOrders && pendingOrders.length > 0 ? (
              <div className="space-y-2">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`border rounded p-4 cursor-pointer transition-all ${
                      selectedOrder === order.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">
                          {order.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer_name ||
                            "Mesa: " + getTableName(order)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(
                            new Date(order.created_at),
                            "dd MMM yyyy HH:mm",
                            { locale: es },
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          S/ {order.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No hay órdenes pendientes de cobro
              </div>
            )}
          </div>

          <div className="bg-card border rounded-lg p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Generar Comprobante</h2>

              {selectedOrder && (
                <Button
                  variant={splitBillDetails.isSplit ? "success" : "secondary"}
                  size="sm"
                  onClick={() => setIsSplitModalOpen(true)}
                  className={`font-semibold ${splitBillDetails.isSplit ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted/50 border border-border"}`}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  {splitBillDetails.isSplit
                    ? "Cuenta Dividida Activa"
                    : "Dividir Cuenta"}
                </Button>
              )}
            </div>

            {selectedOrderDetails && (
              <div className="bg-muted/30 border border-border p-4 rounded-xl mb-6 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Total de la Orden:
                  </span>
                  <span className="font-bold text-lg">
                    S/ {Number(selectedOrderDetails.total).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-t pt-2">
                  <span className="text-muted-foreground">Ya Facturado:</span>
                  <span className="font-semibold text-green-600">
                    S/ {totalPaidForOrder.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-dashed pt-2">
                  <span className="text-muted-foreground font-bold">
                    Saldo x Cobrar:
                  </span>
                  <span
                    className={cn(
                      "text-xl font-black",
                      remainingBalance <= 0 ? "text-green-600" : "text-primary",
                    )}
                  >
                    S/ {Math.max(0, remainingBalance).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {splitBillDetails.isSplit && (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mb-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-primary font-bold">
                    Monto pago parcial:
                  </span>
                  <span className="text-lg font-black text-primary">
                    S/ {splitBillDetails.amount.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-primary/70 italic">
                  {splitBillDetails.details}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-red-500 hover:text-red-600 font-bold"
                  onClick={() =>
                    setSplitBillDetails({
                      amount: 0,
                      details: "",
                      isSplit: false,
                    })
                  }
                >
                  Quitar división (Cobrar total)
                </Button>
              </div>
            )}

            {selectedOrder ? (
              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block">Tipo de Comprobante</Label>
                  <div className="flex gap-4">
                    <Button
                      variant={invoiceType === "BOLETA" ? "default" : "outline"}
                      onClick={() => setInvoiceType("BOLETA")}
                      className="flex-1"
                    >
                      Boleta
                    </Button>
                    <Button
                      variant={
                        invoiceType === "FACTURA" ? "default" : "outline"
                      }
                      onClick={() => setInvoiceType("FACTURA")}
                      className="flex-1"
                    >
                      Factura
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Razón Social / Nombre
                  </label>
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, name: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder={
                      invoiceType === "FACTURA"
                        ? "Razón Social"
                        : "Nombre del cliente"
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">RUC / DNI</label>
                  <input
                    type="text"
                    value={customerData.document}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        document: e.target.value,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder={
                      invoiceType === "FACTURA"
                        ? "RUC (11 dígitos)"
                        : "DNI o RUC (Opcional)"
                    }
                    maxLength={11}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Dirección</label>
                  <input
                    type="text"
                    value={customerData.address}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        address: e.target.value,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Dirección fiscal"
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Método de Pago</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="efectivo"
                        id="efectivo"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="efectivo"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Banknote className="mb-2 h-6 w-6" />
                        Efectivo
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="tarjeta"
                        id="tarjeta"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="tarjeta"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <CreditCard className="mb-2 h-6 w-6" />
                        Tarjeta
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="yape"
                        id="yape"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="yape"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Smartphone className="mb-2 h-6 w-6 text-purple-600" />
                        Yape
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="plin"
                        id="plin"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="plin"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Smartphone className="mb-2 h-6 w-6 text-blue-500" />
                        Plin
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "efectivo" && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Monto con el que paga
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <span className="flex items-center justify-center w-8 bg-background border rounded text-muted-foreground">
                            S/
                          </span>
                          <input
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            className="flex-1 bg-background border rounded px-3 py-2"
                            placeholder="0.00"
                            step="0.10"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-end border-t pt-2">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Total a Pagar
                            {splitBillDetails.isSplit ? " (Parcial)" : ""}:
                          </div>
                          <div className="font-semibold text-lg">
                            S/ {invoiceTotal.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Vuelto:
                          </div>
                          <div
                            className={`text-xl font-bold ${change < 0 ? "text-red-500" : "text-green-600"}`}
                          >
                            S/ {change.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() =>
                    generateInvoice.mutate({
                      orderId: selectedOrder,
                      customer: customerData,
                      paymentMethod,
                      type: invoiceType,
                      paymentDetails:
                        paymentMethod === "efectivo"
                          ? {
                              amount_paid: parseFloat(amountPaid),
                              change: change,
                            }
                          : undefined,
                    })
                  }
                  disabled={
                    (invoiceType === "FACTURA" &&
                      (!customerData.name || !customerData.document)) ||
                    generateInvoice.isPending ||
                    !isPaymentValid
                  }
                  className="w-full bg-primary text-white rounded px-4 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generateInvoice.isPending
                    ? "Generando..."
                    : `Generar ${invoiceType === "FACTURA" ? "Factura" : "Boleta"}`}
                </button>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-xl">
                Selecciona una orden del panel izquierdo para generar su
                factura.
              </div>
            )}
          </div>
        </div>

        {/* Split Bill Dialog */}
        {selectedOrderDetails && (
          <SplitBillModal
            open={isSplitModalOpen}
            onOpenChange={setIsSplitModalOpen}
            total={Number(selectedOrderDetails.total)}
            items={selectedOrderDetails.order_items || []}
            onConfirmSplit={(amount, details) => {
              setSplitBillDetails({ amount, details, isSplit: true });
              toast.success(
                `Cuenta dividida confirmada: S/ ${amount.toFixed(2)}`,
              );
            }}
          />
        )}

        <VoidInvoiceModal
          open={isVoidModalOpen}
          onOpenChange={setIsVoidModalOpen}
          invoiceId={invoiceToVoid || ""}
        />

        {/* Recent Invoices */}
        <div className="bg-card border rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Facturas Recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">N° Factura</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-center p-3">Estado</th>
                  <th className="text-center p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices?.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-mono">{invoice.invoice_number}</td>
                    <td className="p-3">{invoice.customer_name}</td>
                    <td className="p-3">
                      {format(new Date(invoice.created_at), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </td>
                    <td className="text-right p-3 font-semibold">
                      S/ {invoice.total.toFixed(2)}
                    </td>
                    <td className="text-center p-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          invoice.sunat_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : invoice.sunat_status === "sent"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invoice.sunat_status === "pending"
                          ? "Pendiente"
                          : invoice.sunat_status === "sent"
                            ? "Enviado"
                            : "Error"}
                      </span>
                    </td>
                    <td className="text-center p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              printInvoice(invoice as InvoiceData);
                              toast.success("Abriendo ventana de impresión...");
                            }}
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              generateInvoicePdf(invoice as InvoiceData);
                              toast.success(
                                `PDF ${invoice.invoice_number} descargado`,
                              );
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Exportar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              downloadInvoiceXml(invoice as InvoiceData);
                              toast.success(
                                `XML ${invoice.invoice_number} descargado`,
                              );
                            }}
                          >
                            <FileCode className="mr-2 h-4 w-4" />
                            Exportar XML
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500 hover:text-red-600 focus:text-red-600"
                            onClick={() => {
                              setInvoiceToVoid(invoice.id);
                              setIsVoidModalOpen(true);
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Anular / NC
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <a href="/" className="text-primary hover:underline">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
