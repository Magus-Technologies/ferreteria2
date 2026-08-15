import {
  BiTransferAlt,
} from 'react-icons/bi'
import {
  FaBalanceScale,
  FaBoxOpen,
  FaBuilding,
  FaCalendarAlt,
  FaCashRegister,
  FaClipboardList,
  FaCog,
  FaDollarSign,
  FaFileInvoice,
  FaHistory,
  FaKey,
  FaPrint,
  FaTruck,
  FaTruckLoading,
  FaUsers,
  FaWrench,
} from 'react-icons/fa'
import {
  FaCalculator,
  FaCartShopping,
  FaFileInvoiceDollar,
  FaGift,
  FaHandHoldingDollar,
  FaWarehouse,
} from 'react-icons/fa6'
import {
  GiMoneyStack,
  GiPayMoney,
  GiReceiveMoney,
  GiTakeMyMoney,
} from 'react-icons/gi'
import { IoMdContact } from 'react-icons/io'
import { IoDocumentAttach } from 'react-icons/io5'
import {
  MdLocalShipping,
  MdOutlinePendingActions,
  MdPointOfSale,
  MdSpaceDashboard,
} from 'react-icons/md'
import { HistoryOutlined, SwapOutlined } from '@ant-design/icons'

/**
 * Iconos de la navegación, indexados por el nombre que usan los JSON de
 * `lib/navigation/module-navs`.
 *
 * Es un único mapa para todos los módulos: antes cada bottom-nav mantenía el
 * suyo, y al mover un ítem de módulo o agregar uno nuevo el icono desaparecía
 * si el mapa de ese módulo no lo tenía.
 */
export const NAV_ICON_MAP: Record<string, React.ComponentType<any>> = {
  BiTransferAlt,
  FaBalanceScale,
  FaBoxOpen,
  FaBuilding,
  FaCalculator,
  FaCalendarAlt,
  FaCartShopping,
  FaCashRegister,
  FaClipboardList,
  FaCog,
  FaDollarSign,
  FaFileInvoice,
  FaFileInvoiceDollar,
  FaGift,
  FaHandHoldingDollar,
  FaHistory,
  FaKey,
  FaPrint,
  FaTruck,
  FaTruckLoading,
  FaUsers,
  FaWarehouse,
  FaWrench,
  GiMoneyStack,
  GiPayMoney,
  GiReceiveMoney,
  GiTakeMyMoney,
  HistoryOutlined,
  IoDocumentAttach,
  IoMdContact,
  MdLocalShipping,
  MdOutlinePendingActions,
  MdPointOfSale,
  MdSpaceDashboard,
  SwapOutlined,
}
