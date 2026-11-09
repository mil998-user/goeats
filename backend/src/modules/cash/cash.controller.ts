import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { parseAmount } from "../../utils/validation";

// CASH REGISTERS

export async function getCashRegisters(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const registers = await prisma.cashRegister.findMany({
      where: { restaurantId },
      include: {
        sessions: {
          where: { status: "OPEN" },
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
        assignedUser: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(200).json({ success: true, registers });
  } catch (error) {
    next(error);
  }
}

export async function createCashRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { name, assignedUserId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }
    if (!name) {
      return res.status(400).json({ success: false, message: "Cash register name is required" });
    }

    const register = await prisma.cashRegister.create({
      data: {
        name,
        restaurantId,
        assignedUserId: assignedUserId ? parseInt(assignedUserId, 10) : null,
      },
      include: {
        assignedUser: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(201).json({ success: true, message: "Cash register created successfully", register });
  } catch (error) {
    next(error);
  }
}

export async function updateCashRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { name, isActive, assignedUserId } = req.body;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const register = await prisma.cashRegister.findFirst({ where: { id, restaurantId } });
    if (!register) {
      return res.status(404).json({ success: false, message: "Cash register not found" });
    }

    const updatedRegister = await prisma.cashRegister.update({
      where: { id },
      data: {
        name,
        isActive,
        assignedUserId: assignedUserId !== undefined ? (assignedUserId ? parseInt(assignedUserId, 10) : null) : undefined,
      },
      include: {
        assignedUser: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(200).json({ success: true, message: "Cash register updated successfully", register: updatedRegister });
  } catch (error) {
    next(error);
  }
}

export async function deleteCashRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const register = await prisma.cashRegister.findFirst({ where: { id, restaurantId } });
    if (!register) {
      return res.status(404).json({ success: false, message: "Cash register not found" });
    }

    await prisma.cashRegister.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Cash register deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// CASH SESSIONS (OPEN / CLOSE)

export async function getActiveSession(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const userId = req.user?.userId;

    if (!restaurantId || !userId) {
      return res.status(400).json({ success: false, message: "Restaurant context and user auth required" });
    }

    // 1. If this user is assigned to a specific cash register, check if that register has an open session
    let session = null;
    const assignedRegister = await prisma.cashRegister.findFirst({
      where: { restaurantId, assignedUserId: userId, isActive: true },
    });

    if (assignedRegister) {
      session = await prisma.cashSession.findFirst({
        where: { status: "OPEN", cashRegisterId: assignedRegister.id },
        include: {
          cashRegister: true,
          user: { select: { id: true, name: true, role: true } },
        },
      });
    }

    // 2. If no assigned session found, check for ANY open session in this restaurant (e.g. opened by Admin/Owner)
    if (!session) {
      session = await prisma.cashSession.findFirst({
        where: {
          status: "OPEN",
          cashRegister: { restaurantId },
        },
        orderBy: { openTime: "desc" },
        include: {
          cashRegister: true,
          user: { select: { id: true, name: true, role: true } },
        },
      });
    }

    if (!session) {
      return res.status(200).json({ success: true, session: null, message: "No active cash session found" });
    }

    return res.status(200).json({ success: true, session });
  } catch (error) {
    next(error);
  }
}

export async function openCashSession(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const userId = req.user?.userId;
    const { cashRegisterId, openAmount } = req.body;

    if (!restaurantId || !userId) {
      return res.status(400).json({ success: false, message: "Restaurant context and user auth required" });
    }
    if (!cashRegisterId || openAmount === undefined) {
      return res.status(400).json({ success: false, message: "cashRegisterId and openAmount are required" });
    }

    const parsedRegisterId = parseInt(cashRegisterId, 10);
    const parsedOpenAmount = parseAmount(openAmount, { allowZero: true });
    if (parsedOpenAmount === null) {
      return res.status(400).json({ success: false, message: "openAmount must be a valid amount" });
    }

    // Verify register belongs to restaurant
    const register = await prisma.cashRegister.findFirst({
      where: { id: parsedRegisterId, restaurantId },
    });
    if (!register) {
      return res.status(404).json({ success: false, message: "Cash register not found" });
    }

    // Check if the register already has an open session (e.g. opened by Admin/Owner)
    const existingRegisterSession = await prisma.cashSession.findFirst({
      where: { cashRegisterId: parsedRegisterId, status: "OPEN" },
      include: {
        cashRegister: true,
        user: { select: { id: true, name: true, role: true } },
      },
    });

    if (existingRegisterSession) {
      // Return existing session directly as it's already open and linked
      return res.status(200).json({
        success: true,
        message: `La caja registradora ya se encuentra abierta por ${existingRegisterSession.user.name}. Vinculada exitosamente.`,
        session: existingRegisterSession,
      });
    }

    const session = await prisma.cashSession.create({
      data: {
        cashRegisterId: parsedRegisterId,
        userId,
        openAmount: parsedOpenAmount,
        status: "OPEN",
      },
      include: {
        cashRegister: true,
        user: { select: { id: true, name: true, role: true } },
      },
    });

    // Notify clients via socket
    const io = req.app.get("io");
    if (io && restaurantId) {
      io.to(`restaurant-${restaurantId}`).emit("cash-session-changed", {
        action: "OPENED",
        session,
      });
    }

    return res.status(201).json({ success: true, message: "Sesión de caja abierta con éxito", session });
  } catch (error) {
    next(error);
  }
}

export async function closeCashSession(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const userId = req.user?.userId;
    const { closeAmount, sessionId } = req.body; // Real cash in box reported by cashier

    if (!restaurantId || !userId) {
      return res.status(400).json({ success: false, message: "Restaurant context and user auth required" });
    }
    if (closeAmount === undefined) {
      return res.status(400).json({ success: false, message: "closeAmount is required" });
    }

    const parsedCloseAmount = parseAmount(closeAmount, { allowZero: true });
    if (parsedCloseAmount === null) {
      return res.status(400).json({ success: false, message: "closeAmount must be a valid amount" });
    }

    // Find the active open session
    const session = await prisma.cashSession.findFirst({
      where: {
        id: sessionId ? parseInt(sessionId, 10) : undefined,
        status: "OPEN",
        cashRegister: { restaurantId },
      },
      orderBy: { openTime: "desc" },
      include: {
        sales: { include: { order: { select: { tipAmount: true } } } },
        expenses: true,
        incomes: true,
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "No active cash session found to close" });
    }

    // Calculate system amount: openAmount + totalSales(cash) - totalExpenses + totalIncomes
    const cashSalesTotal = session.sales
      .filter((s) => s.paymentMethod === "01") // Cash sales only
      .reduce((sum, s) => sum + s.paymentCash, 0);

    const expensesTotal = session.expenses.reduce((sum, e) => sum + e.amount, 0);
    const incomesTotal = session.incomes.reduce((sum, i) => sum + i.amount, 0);

    // Cash tips stay in the drawer until handed to the waiter (then registered as an expense)
    const cashTipsTotal = session.sales
      .filter((s) => s.paymentMethod === "01")
      .reduce((sum, s) => sum + (s.order?.tipAmount ?? 0), 0);

    const systemAmount = session.openAmount + cashSalesTotal + cashTipsTotal - expensesTotal + incomesTotal;

    const updatedSession = await prisma.cashSession.update({
      where: { id: session.id },
      data: {
        closeTime: new Date(),
        closeAmount: parsedCloseAmount,
        systemAmount,
        status: "CLOSED",
      },
      include: {
        cashRegister: true,
        user: { select: { id: true, name: true, role: true } },
      },
    });

    // Notify clients via socket
    const io = req.app.get("io");
    if (io && restaurantId) {
      io.to(`restaurant-${restaurantId}`).emit("cash-session-changed", {
        action: "CLOSED",
        sessionId: session.id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cash session closed successfully",
      session: updatedSession,
      summary: {
        openAmount: session.openAmount,
        cashSales: cashSalesTotal,
        cashTips: cashTipsTotal,
        expenses: expensesTotal,
        incomes: incomesTotal,
        expectedSystemAmount: systemAmount,
        realReportedAmount: parsedCloseAmount,
        discrepancy: parsedCloseAmount - systemAmount, // positive = sobra, negative = falta
      },
    });
  } catch (error) {
    next(error);
  }
}

// EXPENSES (EGRESOS)

export async function createExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const userId = req.user?.userId;
    const { amount, description, category } = req.body;
    const parsedAmount = parseAmount(amount);

    if (!restaurantId || !userId) {
      return res.status(400).json({ success: false, message: "Restaurant context and user auth required" });
    }
    if (parsedAmount === null || !description || !category) {
      return res.status(400).json({ success: false, message: "Amount, description, and category are required" });
    }

    // Must have an active open session in this restaurant
    const session = await prisma.cashSession.findFirst({
      where: {
        status: "OPEN",
        cashRegister: { restaurantId },
      },
      orderBy: { openTime: "desc" },
    });
    if (!session) {
      return res.status(400).json({ success: false, message: "You must have an open cash session to register expenses" });
    }

    const expense = await prisma.expense.create({
      data: {
        cashSessionId: session.id,
        userId,
        amount: parsedAmount,
        description,
        category,
        restaurantId,
      },
    });

    return res.status(201).json({ success: true, message: "Expense registered successfully", expense });
  } catch (error) {
    next(error);
  }
}

// INCOMES (INGRESOS EXTRA)

export async function createIncome(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const userId = req.user?.userId;
    const { amount, description } = req.body;
    const parsedAmount = parseAmount(amount);

    if (!restaurantId || !userId) {
      return res.status(400).json({ success: false, message: "Restaurant context and user auth required" });
    }
    if (parsedAmount === null || !description) {
      return res.status(400).json({ success: false, message: "Amount and description are required" });
    }

    // Must have an active open session in this restaurant
    const session = await prisma.cashSession.findFirst({
      where: {
        status: "OPEN",
        cashRegister: { restaurantId },
      },
      orderBy: { openTime: "desc" },
    });
    if (!session) {
      return res.status(400).json({ success: false, message: "You must have an open cash session to register incomes" });
    }

    const income = await prisma.income.create({
      data: {
        cashSessionId: session.id,
        userId,
        amount: parsedAmount,
        description,
        restaurantId,
      },
    });

    return res.status(201).json({ success: true, message: "Income registered successfully", income });
  } catch (error) {
    next(error);
  }
}

// SESSION TRANSACTIONS

export async function getSessionTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(sessionId) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid sessionId or restaurant context missing" });
    }

    // Verify session belongs to restaurant
    const session = await prisma.cashSession.findFirst({
      where: {
        id: sessionId,
        cashRegister: { restaurantId },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Cash session not found" });
    }

    const sales = await prisma.sale.findMany({
      where: { cashSessionId: sessionId },
      include: {
        order: true,
        client: true,
      },
    });

    const expenses = await prisma.expense.findMany({
      where: { cashSessionId: sessionId },
      include: {
        user: { select: { name: true } },
      },
    });

    const incomes = await prisma.income.findMany({
      where: { cashSessionId: sessionId },
      include: {
        user: { select: { name: true } },
      },
    });

    return res.status(200).json({
      success: true,
      session: {
        id: session.id,
        openTime: session.openTime,
        closeTime: session.closeTime,
        openAmount: session.openAmount,
        closeAmount: session.closeAmount,
        systemAmount: session.systemAmount,
        status: session.status,
      },
      transactions: {
        sales,
        expenses,
        incomes,
      },
    });
  } catch (error) {
    next(error);
  }
}
