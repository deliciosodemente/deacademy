# 🏗️ GLADIATOR ARENA - ARQUITECTURA TÉCNICA

## *Diseño de Sistema Escalable y Robusto*

---

## 🎯 **OVERVIEW DE ARQUITECTURA**

Gladiator Arena está diseñado como una **aplicación distribuida de alta disponibilidad** que puede manejar miles de combates simultáneos y transacciones financieras en tiempo real.

```
🏛️ ARQUITECTURA GENERAL
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │   DATABASES     │
│                 │    │                 │    │                 │
│ • Unity Client  │◄──►│ • Node.js API   │◄──►│ • MongoDB       │
│ • Web Portal    │    │ • Socket.io     │    │ • Redis Cache   │
│ • Mobile App    │    │ • Auth0         │    │ • InfluxDB      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   SERVICES      │
                    │                 │
                    │ • Stripe API    │
                    │ • WebRTC        │
                    │ • ML Engine     │
                    │ • Notification  │
                    └─────────────────┘
```

---

## 🖥️ **BACKEND ARCHITECTURE**

### 🔧 **Core Services**

```javascript
// Microservicios principales
const services = {
  authService: {
    port: 3001,
    responsibilities: ['Authentication', 'Authorization', 'User management'],
    dependencies: ['Auth0', 'MongoDB']
  },
  
  gameService: {
    port: 3002,
    responsibilities: ['Gladiator management', 'Combat logic', 'Game state'],
    dependencies: ['MongoDB', 'Redis']
  },
  
  battleService: {
    port: 3003,
    responsibilities: ['Real-time battles', 'Matchmaking', 'Battle history'],
    dependencies: ['Socket.io', 'Redis', 'MongoDB']
  },
  
  economyService: {
    port: 3004,
    responsibilities: ['Transactions', 'Betting', 'Payouts', 'Withdrawals'],
    dependencies: ['Stripe', 'MongoDB', 'Redis']
  },
  
  notificationService: {
    port: 3005,
    responsibilities: ['Push notifications', 'Emails', 'SMS'],
    dependencies: ['Firebase', 'SendGrid', 'Twilio']
  }
};
```

### 🗄️ **Database Design**

```javascript
// MongoDB Collections Schema
const schemas = {
  users: {
    _id: 'ObjectId',
    auth0Id: 'String (unique)',
    username: 'String (unique)',
    email: 'String',
    profile: {
      avatar: 'String (URL)',
      level: 'Number',
      experience: 'Number',
      reputation: 'Number'
    },
    wallet: {
      balance: 'Number', // Arena Coins
      totalDeposited: 'Number',
      totalWithdrawn: 'Number',
      pendingWithdrawals: 'Array'
    },
    stats: {
      totalBattles: 'Number',
      totalWins: 'Number',
      winRate: 'Number',
      totalEarnings: 'Number',
      favoriteGladiatorType: 'String'
    },
    settings: {
      notifications: 'Object',
      privacy: 'Object',
      language: 'String'
    },
    createdAt: 'Date',
    updatedAt: 'Date'
  },

  gladiators: {
    _id: 'ObjectId',
    ownerId: 'ObjectId (ref: users)',
    name: 'String',
    type: 'String (TANK|BERSERKER|ASSASSIN|MAGE|ARCHER)',
    rarity: 'String (COMMON|RARE|EPIC|LEGENDARY)',
    stats: {
      health: 'Number',
      maxHealth: 'Number',
      attack: 'Number',
      defense: 'Number',
      speed: 'Number',
      critical: 'Number',
      level: 'Number',
      experience: 'Number'
    },
    combat: {
      wins: 'Number',
      losses: 'Number',
      winStreak: 'Number',
      totalDamageDealt: 'Number',
      totalDamageTaken: 'Number',
      averageBattleTime: 'Number'
    },
    market: {
      isForSale: 'Boolean',
      price: 'Number',
      listedAt: 'Date'
    },
    abilities: ['String'],
    equipment: {
      weapon: 'ObjectId (ref: items)',
      armor: 'ObjectId (ref: items)',
      accessory: 'ObjectId (ref: items)'
    },
    isAlive: 'Boolean',
    createdAt: 'Date',
    diedAt: 'Date'
  },

  battles: {
    _id: 'ObjectId',
    battleId: 'String (unique)',
    type: 'String (RANKED|CASUAL|TOURNAMENT|TRAINING)',
    status: 'String (PENDING|ACTIVE|COMPLETED|CANCELLED)',
    participants: [{
      userId: 'ObjectId (ref: users)',
      gladiatorId: 'ObjectId (ref: gladiators)',
      bet: 'Number',
      odds: 'Number'
    }],
    spectators: [{
      userId: 'ObjectId (ref: users)',
      bet: 'Number',
      bettingOn: 'ObjectId (gladiator)'
    }],
    arena: {
      type: 'String',
      modifiers: 'Object'
    },
    combat: {
      rounds: ['Object'], // Detailed combat log
      winner: 'ObjectId (gladiator)',
      battleTime: 'Number',
      totalDamage: 'Number'
    },
    rewards: {
      winnerPayout: 'Number',
      spectatorPayouts: ['Object']
    },
    createdAt: 'Date',
    startedAt: 'Date',
    completedAt: 'Date'
  },

  transactions: {
    _id: 'ObjectId',
    userId: 'ObjectId (ref: users)',
    type: 'String (DEPOSIT|WITHDRAWAL|BET|PAYOUT|PURCHASE|SALE)',
    amount: 'Number',
    currency: 'String (AC|USD)',
    status: 'String (PENDING|COMPLETED|FAILED|CANCELLED)',
    reference: {
      type: 'String (STRIPE|PAYPAL|BATTLE|MARKETPLACE)',
      id: 'String'
    },
    metadata: 'Object',
    createdAt: 'Date',
    processedAt: 'Date'
  }
};
```

### ⚡ **Redis Cache Strategy**

```javascript
// Estrategia de cache para performance
const cacheStrategy = {
  // Hot data - Cache por 5 minutos
  activeGladiators: 'gladiator:active:*',
  onlineUsers: 'users:online',
  activeBattles: 'battles:active:*',
  
  // Warm data - Cache por 1 hora
  userProfiles: 'user:profile:*',
  gladiatorStats: 'gladiator:stats:*',
  leaderboards: 'leaderboard:*',
  
  // Cold data - Cache por 24 horas
  battleHistory: 'battle:history:*',
  marketListings: 'market:listings',
  tournamentSchedule: 'tournaments:schedule'
};

// Implementación de cache
class CacheManager {
  async getGladiator(gladiatorId) {
    const cacheKey = `gladiator:${gladiatorId}`;
    let gladiator = await redis.get(cacheKey);
    
    if (!gladiator) {
      gladiator = await mongodb.gladiators.findById(gladiatorId);
      await redis.setex(cacheKey, 300, JSON.stringify(gladiator));
    }
    
    return JSON.parse(gladiator);
  }
  
  async invalidateGladiator(gladiatorId) {
    await redis.del(`gladiator:${gladiatorId}`);
    await redis.del(`gladiator:stats:${gladiatorId}`);
  }
}
```

---

## ⚔️ **COMBAT ENGINE**

### 🎲 **Battle Simulation**

```javascript
class BattleEngine {
  constructor() {
    this.battleState = new Map();
    this.spectators = new Map();
  }

  async startBattle(battleId, gladiator1, gladiator2) {
    const battle = {
      id: battleId,
      gladiators: [gladiator1, gladiator2],
      currentRound: 1,
      maxRounds: 10,
      combatLog: [],
      status: 'ACTIVE'
    };

    this.battleState.set(battleId, battle);
    
    // Notify spectators
    this.broadcastBattleStart(battleId, battle);
    
    // Start combat simulation
    return this.simulateCombat(battle);
  }

  async simulateCombat(battle) {
    while (battle.currentRound <= battle.maxRounds) {
      const roundResult = await this.simulateRound(battle);
      battle.combatLog.push(roundResult);
      
      // Check for winner
      if (roundResult.winner) {
        battle.status = 'COMPLETED';
        battle.winner = roundResult.winner;
        break;
      }
      
      battle.currentRound++;
      
      // Broadcast round result to spectators
      this.broadcastRoundResult(battle.id, roundResult);
      
      // Small delay for dramatic effect
      await this.sleep(2000);
    }
    
    return this.finalizeBattle(battle);
  }

  simulateRound(battle) {
    const [g1, g2] = battle.gladiators;
    
    // Determine turn order based on speed
    const turnOrder = g1.stats.speed >= g2.stats.speed ? [g1, g2] : [g2, g1];
    
    const roundLog = {
      round: battle.currentRound,
      actions: [],
      healthBefore: {
        [g1.id]: g1.stats.health,
        [g2.id]: g2.stats.health
      }
    };

    // Execute attacks
    for (const attacker of turnOrder) {
      const defender = attacker === g1 ? g2 : g1;
      
      if (defender.stats.health <= 0) break;
      
      const action = this.executeAttack(attacker, defender);
      roundLog.actions.push(action);
      
      // Check if defender died
      if (defender.stats.health <= 0) {
        roundLog.winner = attacker.id;
        break;
      }
    }

    roundLog.healthAfter = {
      [g1.id]: g1.stats.health,
      [g2.id]: g2.stats.health
    };

    return roundLog;
  }

  executeAttack(attacker, defender) {
    let damage = attacker.stats.attack;
    
    // Apply defense
    damage = Math.max(1, damage - defender.stats.defense * 0.5);
    
    // Critical hit check
    const isCritical = Math.random() < (attacker.stats.critical / 100);
    if (isCritical) {
      damage *= 2;
    }
    
    // Apply special abilities
    damage = this.applySpecialAbilities(attacker, defender, damage);
    
    // Deal damage
    defender.stats.health = Math.max(0, defender.stats.health - damage);
    
    return {
      attacker: attacker.id,
      defender: defender.id,
      damage: Math.floor(damage),
      isCritical,
      defenderHealth: defender.stats.health,
      abilities: [] // Special abilities used
    };
  }

  applySpecialAbilities(attacker, defender, baseDamage) {
    let finalDamage = baseDamage;
    
    // Type-specific abilities
    switch (attacker.type) {
      case 'BERSERKER':
        // Blood rage - more damage when low health
        const healthPercent = attacker.stats.health / attacker.stats.maxHealth;
        if (healthPercent < 0.5) {
          finalDamage *= (1 + (0.5 - healthPercent));
        }
        break;
        
      case 'ASSASSIN':
        // Poison blade - DOT effect
        if (Math.random() < 0.3) {
          defender.effects = defender.effects || {};
          defender.effects.poison = 3; // 3 rounds of poison
        }
        break;
        
      case 'TANK':
        // Shield bash - chance to stun
        if (Math.random() < 0.2) {
          defender.effects = defender.effects || {};
          defender.effects.stunned = 1; // Skip next turn
        }
        break;
    }
    
    return finalDamage;
  }

  async finalizeBattle(battle) {
    // Update gladiator stats
    await this.updateGladiatorStats(battle);
    
    // Process payouts
    await this.processPayouts(battle);
    
    // Save battle to database
    await this.saveBattleResult(battle);
    
    // Broadcast final result
    this.broadcastBattleEnd(battle.id, battle);
    
    // Clean up battle state
    this.battleState.delete(battle.id);
    
    return battle;
  }
}
```

### 🔄 **Real-time Updates**

```javascript
// Socket.io integration for real-time battle updates
class BattleSocketManager {
  constructor(io) {
    this.io = io;
    this.battleRooms = new Map();
  }

  joinBattle(socket, battleId, userId) {
    socket.join(`battle:${battleId}`);
    
    // Track spectators
    if (!this.battleRooms.has(battleId)) {
      this.battleRooms.set(battleId, new Set());
    }
    this.battleRooms.get(battleId).add(userId);
    
    // Send current battle state
    const battleState = battleEngine.getBattleState(battleId);
    socket.emit('battle:state', battleState);
  }

  broadcastRoundResult(battleId, roundResult) {
    this.io.to(`battle:${battleId}`).emit('battle:round', roundResult);
  }

  broadcastBattleEnd(battleId, finalResult) {
    this.io.to(`battle:${battleId}`).emit('battle:end', finalResult);
    
    // Clean up room
    this.battleRooms.delete(battleId);
  }
}
```

---

## 💰 **PAYMENT SYSTEM**

### 💳 **Stripe Integration**

```javascript
class PaymentService {
  constructor() {
    this.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }

  async createDeposit(userId, amount, currency = 'usd') {
    try {
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        metadata: {
          userId,
          type: 'DEPOSIT'
        }
      });

      // Save transaction record
      await this.saveTransaction({
        userId,
        type: 'DEPOSIT',
        amount,
        currency: 'USD',
        status: 'PENDING',
        reference: {
          type: 'STRIPE',
          id: paymentIntent.id
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        transactionId: paymentIntent.id
      };
    } catch (error) {
      throw new Error(`Deposit failed: ${error.message}`);
    }
  }

  async processWithdrawal(userId, amount) {
    try {
      // Validate user balance
      const user = await User.findById(userId);
      if (user.wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Apply withdrawal fee (10%)
      const fee = amount * 0.1;
      const netAmount = amount - fee;

      // Create Stripe transfer (requires Connect account)
      const transfer = await this.stripe.transfers.create({
        amount: netAmount * 100,
        currency: 'usd',
        destination: user.stripeAccountId,
        metadata: {
          userId,
          type: 'WITHDRAWAL'
        }
      });

      // Update user balance
      await User.updateOne(
        { _id: userId },
        { 
          $inc: { 
            'wallet.balance': -amount,
            'wallet.totalWithdrawn': netAmount
          }
        }
      );

      // Save transaction
      await this.saveTransaction({
        userId,
        type: 'WITHDRAWAL',
        amount: netAmount,
        currency: 'USD',
        status: 'COMPLETED',
        reference: {
          type: 'STRIPE',
          id: transfer.id
        }
      });

      return { success: true, netAmount, fee };
    } catch (error) {
      throw new Error(`Withdrawal failed: ${error.message}`);
    }
  }

  async handleWebhook(event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handleDepositSuccess(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await this.handleDepositFailure(event.data.object);
        break;
        
      case 'transfer.paid':
        await this.handleWithdrawalSuccess(event.data.object);
        break;
    }
  }

  async handleDepositSuccess(paymentIntent) {
    const { userId } = paymentIntent.metadata;
    const amount = paymentIntent.amount / 100;
    
    // Convert USD to Arena Coins (1 USD = 1000 AC)
    const arenaCoins = amount * 1000;
    
    // Update user balance
    await User.updateOne(
      { _id: userId },
      { 
        $inc: { 
          'wallet.balance': arenaCoins,
          'wallet.totalDeposited': amount
        }
      }
    );
    
    // Update transaction status
    await Transaction.updateOne(
      { 'reference.id': paymentIntent.id },
      { status: 'COMPLETED' }
    );
    
    // Send notification
    await notificationService.send(userId, {
      type: 'DEPOSIT_SUCCESS',
      message: `Deposit of $${amount} successful! ${arenaCoins} AC added to your wallet.`
    });
  }
}
```

---

## 🔒 **SECURITY MEASURES**

### 🛡️ **Authentication & Authorization**

```javascript
// JWT middleware with Auth0 integration
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify with Auth0
    const decoded = jwt.verify(token, process.env.AUTH0_PUBLIC_KEY, {
      algorithms: ['RS256'],
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`
    });
    
    // Get user from database
    const user = await User.findOne({ auth0Id: decoded.sub });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user.roles.some(role => roles.includes(role))) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### 🔍 **Anti-Cheat System**

```javascript
class AntiCheatEngine {
  constructor() {
    this.suspiciousPatterns = new Map();
    this.userBehavior = new Map();
  }

  analyzeUserBehavior(userId, action) {
    const behavior = this.userBehavior.get(userId) || {
      actions: [],
      patterns: {},
      riskScore: 0
    };

    behavior.actions.push({
      type: action.type,
      timestamp: Date.now(),
      metadata: action.metadata
    });

    // Analyze patterns
    this.detectBotBehavior(userId, behavior);
    this.detectImpossibleWinRates(userId, behavior);
    this.detectSuspiciousBetting(userId, behavior);

    this.userBehavior.set(userId, behavior);

    // Take action if risk score too high
    if (behavior.riskScore > 80) {
      this.flagUser(userId, behavior);
    }
  }

  detectBotBehavior(userId, behavior) {
    const recentActions = behavior.actions.slice(-10);
    
    // Check for inhuman timing patterns
    const timings = recentActions.map((action, i) => {
      if (i === 0) return 0;
      return action.timestamp - recentActions[i-1].timestamp;
    }).slice(1);

    const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
    const variance = timings.reduce((acc, timing) => acc + Math.pow(timing - avgTiming, 2), 0) / timings.length;

    // Suspiciously consistent timing (bots)
    if (variance < 100 && avgTiming < 500) {
      behavior.riskScore += 30;
      behavior.patterns.botLikeTiming = true;
    }
  }

  detectImpossibleWinRates(userId, behavior) {
    // Check win rate vs expected probability
    const battles = behavior.actions.filter(a => a.type === 'BATTLE_RESULT');
    if (battles.length > 20) {
      const wins = battles.filter(b => b.metadata.won).length;
      const winRate = wins / battles.length;
      
      // Win rate > 90% is statistically impossible
      if (winRate > 0.9) {
        behavior.riskScore += 50;
        behavior.patterns.impossibleWinRate = true;
      }
    }
  }

  async flagUser(userId, behavior) {
    // Suspend user account
    await User.updateOne(
      { _id: userId },
      { 
        status: 'SUSPENDED',
        suspensionReason: 'Suspicious activity detected',
        suspendedAt: new Date()
      }
    );

    // Notify moderators
    await this.notifyModerators(userId, behavior);
    
    // Log incident
    console.log(`User ${userId} flagged for suspicious activity:`, behavior.patterns);
  }
}
```

---

## 📊 **MONITORING & ANALYTICS**

### 📈 **Performance Monitoring**

```javascript
// Custom metrics collection
class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.influxDB = new InfluxDB(process.env.INFLUXDB_URL);
  }

  recordMetric(name, value, tags = {}) {
    const point = {
      measurement: name,
      tags,
      fields: { value },
      timestamp: new Date()
    };

    this.influxDB.writePoint(point);
  }

  // Battle-specific metrics
  recordBattleMetrics(battle) {
    this.recordMetric('battle_duration', battle.duration, {
      arena: battle.arena.type,
      gladiator1_type: battle.gladiators[0].type,
      gladiator2_type: battle.gladiators[1].type
    });

    this.recordMetric('battle_spectators', battle.spectators.length, {
      arena: battle.arena.type
    });
  }

  // Economic metrics
  recordTransaction(transaction) {
    this.recordMetric('transaction_volume', transaction.amount, {
      type: transaction.type,
      currency: transaction.currency
    });
  }

  // User engagement metrics
  recordUserAction(userId, action) {
    this.recordMetric('user_action', 1, {
      user_id: userId,
      action_type: action.type
    });
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      stripe: await checkStripeHealth(),
      auth0: await checkAuth0Health()
    },
    metrics: {
      activeUsers: await getActiveUserCount(),
      activeBattles: await getActiveBattleCount(),
      systemLoad: process.cpuUsage()
    }
  };

  const allHealthy = Object.values(health.services).every(service => service.status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json(health);
});
```

---

## 🚀 **DEPLOYMENT & SCALING**

### 🐳 **Docker Configuration**

```dockerfile
# Dockerfile for Gladiator Arena API
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S gladiator -u 1001

# Change ownership
RUN chown -R gladiator:nodejs /app
USER gladiator

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

### ☸️ **Kubernetes Deployment**

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gladiator-arena-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gladiator-arena-api
  template:
    metadata:
      labels:
        app: gladiator-arena-api
    spec:
      containers:
      - name: api
        image: gladiator-arena:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: gladiator-secrets
              key: mongodb-uri
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: gladiator-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: gladiator-arena-service
spec:
  selector:
    app: gladiator-arena-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 📊 **Auto-scaling Configuration**

```yaml
# hpa.yaml - Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gladiator-arena-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gladiator-arena-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

---

## 🎊 **CONCLUSIÓN TÉCNICA**

La arquitectura de **Gladiator Arena** está diseñada para:

- ⚡ **Alta Performance** - Manejo de miles de usuarios concurrentes
- 🔒 **Máxima Seguridad** - Protección de transacciones financieras
- 📈 **Escalabilidad Infinita** - Crecimiento horizontal automático
- 🛡️ **Alta Disponibilidad** - 99.9% uptime garantizado
- 🔍 **Observabilidad Completa** - Monitoreo en tiempo real

**¡Lista para conquistar el mundo del gaming!** 🏛️⚔️👑

---

*Arquitectura diseñada para la gloria eterna* ⚔️
