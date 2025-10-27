import {
  BookMarkedIcon,
  ClipboardList,
  Image as ImageIcon,
  List,
  PlusSquare,
  Tag,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const linkBase =
  "flex items-center gap-3 border border-gray-500 border-r-0 px-3 py-2 rounded-lg bg-gray-200";
const activeClasses = "bg-slate-800 text-white border-slate-800";

const Sidebar = () => {
  return (
    <div className="w-[18%] min-h-screen border-r-2">
      <div className="flex flex-col gap-4 pt-6 pl-[20%] text-[15px]">
        <NavLink
          to="/add"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? activeClasses : ""}`
          }
        >
          <PlusSquare className="w-6 h-6" />
          <p className="hidden text-lg font-semibold md:block">Add Items</p>
        </NavLink>

        <NavLink
          to="/list"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? activeClasses : ""}`
          }
        >
          <List className="w-6 h-6" />
          <p className="hidden text-lg font-semibold md:block">List Items</p>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? activeClasses : ""}`
          }
        >
          <ClipboardList className="w-6 h-6" />
          <p className="hidden text-lg font-semibold md:block">View Orders</p>
        </NavLink>

        <NavLink
          to="/categories"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? activeClasses : ""}`
          }
        >
          <Tag className="w-6 h-6" />
          <p className="hidden text-lg font-semibold md:block">Categories</p>
        </NavLink>

        {/* NEW: Content */}
        <NavLink
          to="/content"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? activeClasses : ""}`
          }
        >
          <ImageIcon className="w-6 h-6" />
          <p className="hidden text-lg font-semibold md:block">Content</p>
        </NavLink>
        <NavLink
          to="/marketing"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? activeClasses : ""}`
          }
        >
          <BookMarkedIcon className="w-6 h-6" />
          <p className="hidden text-lg font-semibold md:block">Marketing</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
